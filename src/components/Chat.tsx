import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  X, 
  Reply, 
  CornerDownRight, 
  Image, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  Settings,
  ArrowDown,
  HelpCircle,
  Brain
} from 'lucide-react';
import { generateGeminiResponse, generateAreaSelectionResponse, type ChatMessage } from '../lib/gemini';
import { querySimilarChunks } from '../lib/embeddings';
import ChatMessageComponent from './ChatMessage';
import ThinkingAnimation from './ThinkingAnimation';
import { saveUserMessage, saveCompletedConversation, saveChatMessages } from '../lib/services/chatService';
import { useSubscription } from '../contexts/SubscriptionContext';
import { checkMessageLimit } from '../lib/messageUsage';
import { useTranslation } from 'react-i18next';

const CHARACTER_LIMIT = 700;
const MAX_MESSAGE_PAIRS = 15; // This will keep last 10 user-assistant interactions (20 messages total)

interface ChatProps {
  documentContent: string;
  documentId: string;
  initialMessages?: ChatMessage[];
  onChatUpdate?: (messages: ChatMessage[]) => void;
  selectedText?: string | null;
  selectedImage?: string | null;
  onClearSelection?: () => void;
  documentType?: 'youtube';
  youtubeUrl?: string;
  onTimestampClick?: (time: number) => void;
}

export default function Chat({
  documentContent,
  documentId,
  initialMessages = [],
  onChatUpdate,
  selectedText,
  selectedImage,
  onClearSelection,
  documentType,
  youtubeUrl,
  onTimestampClick,
}: ChatProps) {
  const { t, ready } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile] = useState(() => window.innerWidth <= 768);
  const [showReplyingTo, setShowReplyingTo] = useState(false);
  const documentIdRef = useRef<string>(documentId);
  const runRef = useRef<any>(null);
  const [streamComplete, setStreamComplete] = useState(true);
  const fullResponseRef = useRef<string>('');
  const currentMessagesRef = useRef<ChatMessage[]>(messages);
  const hasEndedRef = useRef<boolean>(false);
  const userId = localStorage.getItem('userId');
  const { plan } = useSubscription();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [useDeepSeek, setUseDeepSeek] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isOverLimitRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);

  useEffect(() => {
    const cleanedInitialMessages = trimMessageHistory(initialMessages);
    setMessages(cleanedInitialMessages);
    currentMessagesRef.current = cleanedInitialMessages;
  }, [initialMessages]);

  useEffect(() => {
    currentMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (selectedText || selectedImage) {
      setShowReplyingTo(true);
      if (isMobile) {
        setTimeout(() => {
          const replyElement = document.querySelector('.reply-indicator');
          replyElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    } else {
      setShowReplyingTo(false);
    }
  }, [selectedText, selectedImage, isMobile]);

  useEffect(() => {
    documentIdRef.current = documentId;
    return () => {
      if (runRef.current) {
        runRef.current.off();
      }
    };
  }, [documentId]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!chatContainerRef.current) return;
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, []);

  useEffect(() => {
    if (messages.length || currentResponse || isThinking) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [messages, currentResponse, isThinking, scrollToBottom]);

  const handleStreamEnd = async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    try {
      const finalMessages = await saveCompletedConversation(
        documentId,
        currentMessagesRef.current,
        fullResponseRef.current
      );
      
      setCurrentResponse('');
      setMessages(finalMessages);
      
      if (onChatUpdate) {
        await onChatUpdate(finalMessages);
      }

      if (onClearSelection) {
        onClearSelection();
      }
    } catch (error) {
      console.error('Error saving completed conversation:', error);
    } finally {
      setStreamComplete(true);
      setIsLoading(false);
      setIsTyping(false);
      setIsThinking(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= CHARACTER_LIMIT) {
      setInput(newValue);
      if (isOverLimitRef.current) {
        isOverLimitRef.current = false;
        setIsOverLimit(false);
      }
    } else if (!isOverLimitRef.current) {
      isOverLimitRef.current = true;
      setIsOverLimit(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedText && !selectedImage) || isLoading || !userId) return;

    const messageType = selectedImage ? 'area' : 'text';
    
    try {
      // Check message limits
      const limitCheck = await checkMessageLimit(userId, messageType, plan);
      if (!limitCheck.allowed) {
        setError(t('documentView.chat.errors.messageLimit'));
        return;
      }

      let messageContent = '';
      if (selectedImage) {
        messageContent = input.trim() || t('chat.placeholder.selectedArea');
      } else if (selectedText) {
        messageContent = input.trim() 
          ? `${t('chat.replyingTo.selectedText')}: "${selectedText}"\n\n${t('chat.placeholder.selectedText')} ${input}`
          : `${t('chat.placeholder.selectedText')}: "${selectedText}"`;
      } else {
        // Handle the case when user just types "explain"
        messageContent = input;
      }

      const userMessage: ChatMessage = {
        role: 'user',
        content: messageContent
      };

      setIsLoading(true);
      setIsTyping(true);
      setIsThinking(true);
      setCurrentResponse('');
      setShowReplyingTo(false);
      setStreamComplete(false);
      setInput('');
      setError(null);
      fullResponseRef.current = '';
      hasEndedRef.current = false;

      const updatedMessages = await saveUserMessage(documentId, currentMessagesRef.current, userMessage);
      const trimmedMessages = trimMessageHistory(updatedMessages);
      setMessages(trimmedMessages);

      if (onChatUpdate) {
        await onChatUpdate(trimmedMessages);
      }

      // Retrieve chunks once for both models
      const relevantChunks = await querySimilarChunks(messageContent, documentId);
      const contextText = relevantChunks.join('\n\n');

      try {
        console.log('🤖 Attempting Gemini response...');
        // Set up timeout for Gemini responses
        let geminiTimeoutId: NodeJS.Timeout | null = null;
        const geminiTimeoutPromise = new Promise((_, reject) => {
          geminiTimeoutId = setTimeout(() => {
            console.log('⏰ Gemini response timed out after 15 seconds');
            reject(new Error('GEMINI_TIMEOUT'));
          }, 11000); // 15 seconds timeout for Gemini
        });

        // Create a promise that wraps the Gemini response and its processing
        const geminiWithProcessing = (async () => {
          try {
            const response = await generateGeminiResponse(
              trimmedMessages,
              documentId,
              contextText || documentContent,
              documentType
            );

            // Handle streaming response
            let accumulatedText = '';
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                accumulatedText += content;
                setCurrentResponse(prev => (prev || '') + content);
              }
            }
            fullResponseRef.current = accumulatedText;
            return accumulatedText;
          } catch (error) {
            console.error('Error in Gemini processing:', error);
            throw error;
          }
        })();

        try {
          // Race between the complete Gemini process and timeout
          const result = await Promise.race([
            geminiWithProcessing,
            geminiTimeoutPromise
          ]);

          // If we get here, Gemini was successful
          await handleStreamEnd();
          console.log('✅ Gemini response successful');
          // Clear the timeout since we succeeded
          if (geminiTimeoutId) {
            clearTimeout(geminiTimeoutId);
          }
        } catch (timeoutOrStreamError: any) {
          // Clear the timeout if it exists
          if (geminiTimeoutId) {
            clearTimeout(geminiTimeoutId);
          }
          // Check if it was a timeout or a different error
          if (timeoutOrStreamError.message === 'GEMINI_TIMEOUT') {
            setError('Gemini timed out. Please try again.');
          } else {
            setError('Error processing Gemini response. Please try again.');
          }
        }
      } catch (error) {
        setError('Unexpected error. Please try again.');
      }
    } catch (error: any) {
      console.error('Error in chat submission:', error);
      setError(t('chat.errors.allServicesFailed'));
      setIsLoading(false);
      setIsTyping(false);
      setIsThinking(false);
    }
  };

  const handleImageAnalysis = async (response: any) => {
    try {
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        const reasoning = chunk.choices[0]?.delta?.reasoning || '';
        if (content || reasoning) {
          if (reasoning) {
            fullResponseRef.current += `\n\n**Reasoning:**\n${reasoning}\n\n`;
            setCurrentResponse(prev => `${prev}\n\n**Reasoning:**\n${reasoning}\n\n`);
          }
          if (content) {
            fullResponseRef.current += content;
            setCurrentResponse(prev => prev + content);
          }
        }
      }
      await handleStreamEnd();
    } catch (error) {
      console.error('Error processing image analysis:', error);
      setCurrentResponse(t('chat.errors.imageAnalysis'));
      handleStreamEnd();
    }
  };

  useEffect(() => {
    if (selectedImage && useDeepSeek) {
      setUseDeepSeek(false);
      setError(t('chat.errors.eduPlusArea'));
      setTimeout(() => setError(null), 3000);
    }
  }, [selectedImage, t]);

  const handleEduPlusToggle = () => {
    if (selectedImage) {
      setError(t('chat.errors.eduPlusArea'));
      setTimeout(() => setError(null), 3000);
      return;
    }
    setUseDeepSeek(!useDeepSeek);
  };

  const trimMessageHistory = (messages: ChatMessage[]): ChatMessage[] => {
    // Keep system messages
    const systemMessages = messages.filter(msg => msg.role === 'system');
    
    // First pass: Remove all consecutive user messages except the last one
    const tempMessages: ChatMessage[] = [];
    let lastMessageWasUser = false;
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      // Always keep system messages
      if (msg.role === 'system') continue;
      
      // Always keep assistant messages
      if (msg.role === 'assistant') {
        tempMessages.push(msg);
        lastMessageWasUser = false;
        continue;
      }
      
      // For user messages:
      if (msg.role === 'user') {
        const isLastMessage = i === messages.length - 1;
        const nextMsg = messages[i + 1];
        
        // Only keep if:
        // 1. It's the last message (we need to keep it for DeepSeek API)
        // 2. It's followed by an assistant message
        // 3. And it's not a consecutive user message
        if (isLastMessage || nextMsg?.role === 'assistant') {
          if (!lastMessageWasUser || isLastMessage) {
            tempMessages.push(msg);
            lastMessageWasUser = true;
          }
        }
      }
    }
    
    // Second pass: Keep only complete pairs plus the last user message
    const cleanedMessages: ChatMessage[] = [];
    let pairs = 0;
    
    for (let i = tempMessages.length - 1; i >= 0; i--) {
      const msg = tempMessages[i];
      const isLastMessage = i === tempMessages.length - 1;
      
      // Always keep the last message if it's a user message
      if (isLastMessage && msg.role === 'user') {
        cleanedMessages.unshift(msg);
        continue;
      }
      
      // Keep complete pairs up to MAX_MESSAGE_PAIRS
      if (pairs < MAX_MESSAGE_PAIRS) {
        if (i > 0 && msg.role === 'assistant' && tempMessages[i - 1].role === 'user') {
          cleanedMessages.unshift(msg);
          cleanedMessages.unshift(tempMessages[i - 1]);
          pairs++;
          i--; // Skip the user message we just added
        }
      }
    }
    
    const finalMessages = [...systemMessages, ...cleanedMessages];
    
    // Save cleaned messages to Firebase
    saveChatMessages(documentId, finalMessages).catch(error => {
      console.error('Error saving cleaned messages to Firebase:', error);
    });
    
    return finalMessages;
  };

  useEffect(() => {
    if (!chatContainerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(chatContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col h-full md:h-[calc(100vh-4rem)] relative max-w-[100rem] mx-auto w-full">
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto pb-[120px] md:pb-[140px]"
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
          setShowScrollButton(!isNearBottom);
        }}
      >
        <div className="p-3 space-y-3">
          {messages.length === 0 && ready ? (
            <div className="text-center text-gray-500 py-8">
              <p className="text-lg font-medium">
                {t('documentView.chat.empty.title')}
              </p>
              <p className="text-sm mt-2">
                {t('documentView.chat.empty.subtitle')}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                message.role !== 'system' && (
                  <ChatMessageComponent
                    key={`${documentId}-${index}`}
                    role={message.role}
                    content={typeof message.content === 'string' ? message.content : Array.isArray(message.content) ? message.content.map(item => item.text || '').join(' ') : ''}
                    animate={false}
                    youtubeUrl={documentType === 'youtube' ? youtubeUrl : undefined}
                    onTimestampClick={onTimestampClick}
                    isComplete={true}
                  />
                )
              ))}
              {isThinking && <ThinkingAnimation />}
              {currentResponse && !hasEndedRef.current && (
                <ChatMessageComponent
                  role="assistant"
                  content={currentResponse}
                  animate={true}
                  youtubeUrl={documentType === 'youtube' ? youtubeUrl : undefined}
                  onTimestampClick={onTimestampClick}
                  isComplete={!streamComplete}
                />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Mobile scroll button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="md:hidden fixed bottom-32 right-4 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-500 transition-colors z-20"
          aria-label={t('documentView.chat.buttons.scrollToBottom')}
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}

      <div className="fixed bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-gray-900/50 z-50" 
        style={{ 
          maxHeight: '40vh', 
          overflowY: 'visible',
          width: containerWidth ? `${containerWidth}px` : '100%',
          left: chatContainerRef.current?.getBoundingClientRect().left + 'px' || '0'
        }}>
        {showReplyingTo && (selectedText || selectedImage) && (
          <div className="mx-3 mb-1 reply-indicator">
            <div className="relative bg-indigo-50 rounded-lg overflow-hidden animate-slideUp">
              <div className="px-2 py-1 md:px-3 md:py-1.5 bg-indigo-100 flex items-center gap-2">
                <Reply className="h-3 w-3 md:h-4 md:w-4 text-indigo-600 animate-bounce-small" />
                <span className="text-xs md:text-sm font-medium text-indigo-600">
                  {t('documentView.chat.replyingTo.selection')} {selectedImage ? t('documentView.chat.replyingTo.selectedArea') : t('documentView.chat.replyingTo.selectedText')}
                </span>
                <button
                  onClick={onClearSelection}
                  className="ml-auto p-1 hover:bg-indigo-200 rounded-full transition-colors"
                >
                  <X className="h-3 w-3 md:h-4 md:w-4 text-indigo-600" />
                </button>
              </div>
              <div className="p-2 flex items-start gap-2">
                <CornerDownRight className="h-3 w-3 md:h-4 md:w-4 text-indigo-400 flex-shrink-0 mt-1" />
                {selectedImage ? (
                  <div className="flex flex-col gap-1 md:gap-2 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <Image className="h-3 w-3 md:h-4 md:w-4 text-indigo-400" />
                      <span className="text-xs md:text-sm text-gray-600">
                        {t('documentView.chat.imageSelection.pdfArea')}
                      </span>
                    </div>
                    <img
                      src={selectedImage}
                      alt={t('documentView.chat.imageSelection.pdfArea')}
                      className="max-h-24 md:max-h-32 rounded border border-indigo-100 shadow-sm"
                    />
                  </div>
                ) : (
                  <p className="text-xs md:text-sm text-gray-600 line-clamp-2 animate-fadeIn">
                    {selectedText}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-2 bg-white dark:bg-gray-900">
          {error && (
            <div className="mb-2 px-2 py-1.5 md:px-3 md:py-2 bg-red-50 border border-red-100 rounded-lg text-xs md:text-sm flex flex-col gap-1 md:gap-2">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
              {error.includes('message limit') && (
                <div className="flex items-center gap-2 pl-6">
                  <Link
                    to="/purchase-messages"
                    className="text-indigo-600 hover:text-indigo-500 font-medium flex items-center gap-1 group"
                  >
                    {t('documentView.chat.errors.purchaseMore')}
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {isOverLimit && (
            <div className="mb-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {t('documentView.chat.errors.characterLimit', { limit: CHARACTER_LIMIT })}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={
                selectedImage
                  ? t('documentView.chat.placeholder.selectedArea')
                  : selectedText
                  ? t('documentView.chat.placeholder.selectedText')
                  : t('documentView.chat.placeholder.default')
              }
              className="flex-1 px-4 py-3 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm border-gray-200 dark:border-gray-700 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 placeholder-gray-500 dark:placeholder-gray-400"
              style={{ 
                height: '48px',
                WebkitAppearance: 'none'
              }}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedText && !selectedImage)}
              className="h-[48px] w-[48px] flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
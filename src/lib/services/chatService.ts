import { updateDocument } from '../firestore';
import type { ChatMessage as FirestoreChatMessage } from '../firestore';
import type { ChatMessage as OpenAIChatMessage } from '../openai';

export async function saveChatMessages(documentId: string, messages: OpenAIChatMessage[]): Promise<void> {
  if (!documentId) {
    console.error('Invalid documentId for saving chat messages:', { documentId });
    return;
  }

  try {
    // Filter out system messages and convert to Firestore format
    const firestoreMessages: FirestoreChatMessage[] = messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      }));

    console.log('Attempting to save chat messages to Firestore:', {
      documentId,
      messageCount: firestoreMessages.length,
      lastMessage: firestoreMessages[firestoreMessages.length - 1]
    });

    await updateDocument(documentId, { 
      chatHistory: firestoreMessages 
    });

    console.log('Successfully saved chat messages to Firestore');
  } catch (error) {
    console.error('Error saving chat messages to Firestore:', error);
    throw error;
  }
}

export async function saveUserMessage(
  documentId: string, 
  messages: OpenAIChatMessage[], 
  userMessage: OpenAIChatMessage
): Promise<OpenAIChatMessage[]> {
  console.log('Saving user message:', userMessage);
  const updatedMessages = [...messages, userMessage];
  await saveChatMessages(documentId, updatedMessages);
  return updatedMessages;
}

export async function saveCompletedConversation(
  documentId: string,
  messages: OpenAIChatMessage[],
  assistantResponse: string
): Promise<OpenAIChatMessage[]> {
  console.log('Saving completed conversation with assistant response:', {
    documentId,
    currentMessages: messages.length,
    responseLength: assistantResponse.length
  });

  const assistantMessage: OpenAIChatMessage = {
    role: 'assistant',
    content: assistantResponse
  };
  
  const finalMessages = [...messages, assistantMessage];
  
  try {
    await saveChatMessages(documentId, finalMessages);
    console.log('Successfully saved complete conversation');
    return finalMessages;
  } catch (error) {
    console.error('Failed to save complete conversation:', error);
    throw error;
  }
}

const formatYouTubeTranscript = (content: string): string => {
  // Convert bullet points to proper markdown lists
  let formatted = content.replace(/•\s+/g, '* ');
  
  // Format section headers
  formatted = formatted.replace(/([^.!?]+)(?=\s+•)/g, '\n## $1\n');
  
  // Add spacing around timestamps
  formatted = formatted.replace(/\[(\d+)s\]/g, ' [`$1s`] ');
  
  // Ensure proper paragraph breaks
  formatted = formatted.replace(/\.\s+([A-Z])/g, '.\n\n$1');
  
  return formatted;
};
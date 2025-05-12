import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { 
  MessageSquare, 
  BookOpen, 
  Brain, 
  HelpCircle, 
  Volume2,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  AlertCircle
} from 'lucide-react';
import Chat from './Chat';
import LectureTranscript from './LectureTranscript';
import { updateDocument, type Document } from '../lib/firestore';

interface LecturePageProps {
  documents: Document[];
  onDocumentsChange?: () => Promise<void>;
}

export default function LecturePage({ documents, onDocumentsChange }: LecturePageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | undefined>(
    documents.find(doc => doc.id === id)
  );
  const [activeTab, setActiveTab] = useState<'chat' | 'summary' | 'notes' | 'flashcards' | 'test' | 'vocalize'>('chat');
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(true);
  const [isMobile] = useState(() => window.innerWidth <= 768);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // Update local state when documents change
  useEffect(() => {
    const updatedDoc = documents.find(doc => doc.id === id);
    if (updatedDoc) {
      setDocument(updatedDoc);
      setNewTitle(updatedDoc.title);
      setChatMessages(updatedDoc.chatHistory || []);
    }
  }, [documents, id]);

  const handleTitleUpdate = async () => {
    if (!document || !newTitle.trim() || newTitle === document.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      await updateDocument(document.id, { title: newTitle.trim() });
      if (onDocumentsChange) {
        await onDocumentsChange();
      }
    } catch (error) {
      console.error('Error updating title:', error);
      setError('Failed to update title');
    } finally {
      setIsEditingTitle(false);
    }
  };

  const handleChatUpdate = async (messages: any[]) => {
    setChatMessages(messages);
    if (document) {
      try {
        await updateDocument(document.id, { chatHistory: messages });
        if (onDocumentsChange) {
          await onDocumentsChange();
        }
      } catch (error) {
        console.error('Error updating chat history:', error);
      }
    }
  };

  const handleTranscriptUpdate = async (newContent: string) => {
    if (!document) return;

    try {
      await updateDocument(document.id, { content: newContent });
      if (onDocumentsChange) {
        await onDocumentsChange();
      }
    } catch (error) {
      console.error('Error updating transcript:', error);
      setError('Failed to update transcript');
    }
  };

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-900">Lecture not found</p>
          <p className="mt-2 text-gray-600">The lecture you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'chat' as const, label: 'Chat', icon: MessageSquare },
    { id: 'summary' as const, label: 'Summary', icon: BookOpen },
    { id: 'flashcards' as const, label: 'Flashcards', icon: Brain },
    { id: 'test' as const, label: 'Test', icon: HelpCircle },
    { id: 'vocalize' as const, label: 'Vocalize', icon: Volume2 }
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row">
      {error && (
        <div className="absolute top-4 right-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 animate-slideUp">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <PanelGroup direction={isMobile ? "vertical" : "horizontal"}>
        {isTranscriptVisible && (
          <>
            <Panel defaultSize={50} minSize={30}>
              <LectureTranscript 
                content={document.content}
                documentId={document.id}
                audioUrl={document.audioUrl}
                onTranscriptUpdate={handleTranscriptUpdate}
              />
            </Panel>
            <PanelResizeHandle className={isMobile ? "h-2 bg-gray-200 hover:bg-gray-300 transition-colors" : "w-2 bg-gray-200 hover:bg-gray-300 transition-colors"}>
              <div className={isMobile ? "h-1 w-8 bg-gray-400 rounded-full mx-auto" : "w-1 h-8 bg-gray-400 rounded-full mx-auto my-2"} />
            </PanelResizeHandle>
          </>
        )}

        <Panel minSize={30}>
          <div className="h-full flex flex-col bg-white">
            <div className="border-b border-gray-200 px-4 md:px-6 py-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTranscriptVisible(!isTranscriptVisible)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={isTranscriptVisible ? "Hide Transcript" : "Show Transcript"}
                  >
                    {isTranscriptVisible ? (
                      <PanelLeftClose className="h-5 w-5 text-gray-600" />
                    ) : (
                      <PanelLeftOpen className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                  {isEditingTitle ? (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleTitleUpdate();
                      }}
                      className="flex-1"
                    >
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={handleTitleUpdate}
                        className="w-full px-2 py-1 text-xl md:text-2xl font-bold text-gray-900 border-b-2 border-indigo-500 focus:outline-none focus:border-indigo-600 bg-transparent"
                        placeholder="Enter lecture title..."
                        autoFocus
                      />
                    </form>
                  ) : (
                    <h1 
                      className="text-xl md:text-2xl font-bold text-gray-900 truncate cursor-pointer hover:text-indigo-600 transition-colors group flex items-center gap-2"
                      onClick={() => {
                        setIsEditingTitle(true);
                        setNewTitle(document.title);
                      }}
                      title="Click to rename"
                    >
                      {document.title}
                      <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h1>
                  )}
                </div>
              </div>

              <div className="flex space-x-1 overflow-x-auto">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 md:px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'text-indigo-600 bg-white border-t border-x border-gray-200'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    style={{
                      marginBottom: '-1px',
                      borderBottom: activeTab === tab.id ? '1px solid white' : undefined
                    }}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6">
              <Chat 
                documentContent={document.content} 
                documentId={document.id}
                initialMessages={chatMessages}
                onChatUpdate={handleChatUpdate}
              />
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
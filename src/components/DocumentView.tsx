import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { 
  FileDown, 
  MessageSquare, 
  BookOpen, 
  PenLine,
  Pencil, 
  Brain, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  Volume2,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Download,
  Plus
} from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage, Document } from '../lib/firestore';
import PdfViewer from './PdfViewer';
import YoutubeViewer from './YoutubeViewer';
import LectureTranscript from './LectureTranscript';
import Chat from './Chat';
import LoadingBook from './LoadingBook';
import LoadingBrain from './LoadingBrain';
import LoadingTest from './LoadingTest';
import LoadingNotes from './LoadingNotes';
import LoadingAudio from './LoadingAudio';
import Flashcard from './Flashcard';
import AudioCard from './AudioCard';
import { generateFlashcards, generateTest, generateNotes, generateStyledText, type TestQuestion } from '../lib/gemini';
import { updateDocument, updateDocumentTitle } from '../lib/firestore';
import { generateSpeech, type AudioStyle } from '../lib/elevenlabs';
import { fetchDocumentAudios, deleteAudio, renameAudio, MAX_AUDIOS_PER_DOCUMENT } from '../lib/storage';
import VocalizeTab from './VocalizeTab';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useTranslation } from 'react-i18next';
import EditableNote from './EditableNote';
import RichTextEditor from "./PlateUi/RichTextEditor";

type Tab = "chat" | "notes" | "flashcards" | "test" | "vocalize";

interface TabInfo {
  id: Tab;
  label: string;
  icon: typeof MessageSquare;
  beta?: boolean;
}

interface DocumentViewProps {
  documents: Document[];
  onDocumentsChange?: () => Promise<void>;
}

interface TestAnswer {
  questionIndex: number;
  selectedAnswer: string;
}

interface AudioEntry {
  url: string;
  style: AudioStyle;
  fileName?: string;
}

const markdownComponents = {
  remarkPlugins: [remarkGfm, remarkMath],
  rehypePlugins: [rehypeKatex],
};

export default function DocumentView({
  documents,
  onDocumentsChange,
}: DocumentViewProps) {
  const { id } = useParams<{ id: string }>();
  const document = documents.find((doc) => doc.id === id);
  const userId = localStorage.getItem("userId");
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [scale, setScale] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFallbackGenerating, setIsFallbackGenerating] = useState(false);
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<
    "left" | "right" | undefined
  >();
  const [localFlashcards, setLocalFlashcards] = useState(
    document?.flashcards || []
  );
  const [localNotes, setLocalNotes] = useState(document?.notes || "");
  const [localTest, setLocalTest] = useState<TestQuestion[]>(
    document?.test || []
  );
  const [testSets, setTestSets] = useState<
    { questions: TestQuestion[]; createdAt: string; instructions?: string }[]
  >(document?.testSets || []);
  const [selectedTestIndex, setSelectedTestIndex] = useState<number>(0);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [testAnswers, setTestAnswers] = useState<TestAnswer[]>([]);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState<number>(0);
  const [audioStyle, setAudioStyle] = useState<AudioStyle>(
    document?.audioStyle || "Lecture"
  );
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPdfVisible, setIsPdfVisible] = useState(true);
  const [customFlashcardInstructions, setCustomFlashcardInstructions] =
    useState<string>("");
  const [customNotesInstructions, setCustomNotesInstructions] =
    useState<string>("");
  const [customTestInstructions, setCustomTestInstructions] =
    useState<string>("");
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(
    document?.audioUrl || null
  );
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [youtubePlayerRef, setYoutubePlayerRef] = useState<any>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(document?.title || "");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    document?.chatHistory || []
  );
  const [savedAudios, setSavedAudios] = useState<AudioEntry[]>([]);
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [customNotesLanguage, setCustomNotesLanguage] = useState("");
  const [customFlashcardsLanguage, setCustomFlashcardsLanguage] = useState("");
  const [customTestLanguage, setCustomTestLanguage] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleTimestampClick = (time: number) => {
    if (youtubePlayerRef) {
      youtubePlayerRef.seekTo(time);
      youtubePlayerRef.playVideo();
    }
  };

  // Check if we're on mobile
  const isMobile = window.innerWidth <= 768;

  // Update scroll buttons visibility
  const updateScrollButtons = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const tabsContainer = tabsContainerRef.current;
    if (tabsContainer) {
      tabsContainer.addEventListener("scroll", updateScrollButtons);
      updateScrollButtons();
      return () =>
        tabsContainer.removeEventListener("scroll", updateScrollButtons);
    }
  }, []);

  // Add resize event listener
  useEffect(() => {
    const handleResize = () => {
      updateScrollButtons();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsContainerRef.current) {
      const scrollAmount = 200;
      tabsContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Update local states when document changes
  useEffect(() => {
    const loadDocumentData = async () => {
      if (document && userId) {
        setLocalFlashcards(document.flashcards || []);
        setLocalNotes(document.notes || "");
        setTestSets(document.testSets || []);
        setCurrentFlashcardIndex(0);
        setTestAnswers([]);
        setTestSubmitted(false);
        setTestScore(0);
        setSelectedText(null);
        setAudioStyle(document.audioStyle || "Lecture");
        setIsAudioPlaying(false);
        setIsGenerating(false);
        setIsGeneratingAudio(false);
        setNewTitle(document.title);

        try {
          // Don't automatically load the test into localTest
          setLocalTest([]);
        } catch (error) {
          console.error("Error parsing test data:", error);
          setLocalTest([]);
        }

        setCurrentFlashcardIndex(0);
        setTestAnswers([]);
        setTestSubmitted(false);
        setTestScore(0);
        setSelectedText(null);
        setAudioStyle(document.audioStyle || "Lecture");
        setIsAudioPlaying(false);
        setIsGenerating(false);
        setIsGeneratingAudio(false);
        setNewTitle(document.title);

        // Fetch all audio files for this document
        const audios = await fetchDocumentAudios(userId, document.id);
        setSavedAudios(audios);
      }
    };

    loadDocumentData();
  }, [document?.id, userId]);

  const handleChatUpdate = async (messages: ChatMessage[]) => {
    setChatMessages(messages);
    if (document) {
      try {
        await updateDocument(document.id, { chatHistory: messages });
        if (onDocumentsChange) {
          await onDocumentsChange();
        }
      } catch (error) {
        console.error("Error updating chat history:", error);
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
      console.error("Error updating transcript:", error);
      setError("Failed to update transcript");
    }
  };

  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  if (!document) {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs: TabInfo[] = [
    { id: "chat", label: t("documentView.tabs.chat"), icon: MessageSquare },
    { id: "notes", label: t("documentView.tabs.notes"), icon: PenLine },
    { id: "flashcards", label: t("documentView.tabs.flashcards"), icon: Brain },
    { id: "test", label: t("documentView.tabs.test"), icon: HelpCircle },
    {
      id: "vocalize",
      label: t("documentView.tabs.vocalize"),
      icon: Volume2,
      beta: true,
    },
  ];

  const handleGenerate = async () => {
    if (!document.content || isGenerating) return;
    setIsGenerating(true);
    setIsFallbackGenerating(false);

    try {
      if (activeTab === "test") {
        try {
          if (testSets.length >= 4) {
            alert(
              "You can only have up to 4 test sets. Please delete an existing test to create a new one."
            );
            return;
          }

          let questions;
          try {
            questions = await generateTest(
              document.content,
              customTestInstructions,
              i18n.language,
              customTestLanguage || undefined
            );
          } catch (error: any) {
            if (error.message === "GEMINI_UNAVAILABLE") {
              setIsFallbackGenerating(true);
              questions = await generateTest(
                document.content,
                customTestInstructions,
                i18n.language,
                customTestLanguage || undefined
              );
            } else {
              throw error;
            }
          }

          const newTestSet = {
            questions,
            createdAt: new Date().toISOString(),
            instructions: customTestInstructions || undefined,
          };

          const updatedTestSets = [...testSets, newTestSet];
          setTestSets(updatedTestSets);
          await updateDocument(document.id, { testSets: updatedTestSets });

          setLocalTest(questions);
          setTestAnswers([]);
          setTestSubmitted(false);
          setTestScore(0);
        } catch (error) {
          console.error("Error generating test:", error);
          throw error;
        }
      } else if (activeTab === "notes") {
        try {
          const notes = await generateNotes(
            document.content,
            customNotesInstructions,
            i18n.language,
            customNotesLanguage || undefined
          );
          await updateDocument(document.id, { notes });
          setLocalNotes(notes);
        } catch (error: any) {
          if (error.message === "GEMINI_UNAVAILABLE") {
            setIsFallbackGenerating(true);
            const notes = await generateNotes(
              document.content,
              customNotesInstructions,
              i18n.language,
              customNotesLanguage || undefined
            );
            await updateDocument(document.id, { notes });
            setLocalNotes(notes);
          } else {
            throw error;
          }
        }
      } else if (activeTab === "flashcards") {
        try {
          const flashcards = await generateFlashcards(
            document.content,
            customFlashcardInstructions,
            i18n.language,
            customFlashcardsLanguage || undefined
          );
          await updateDocument(document.id, { flashcards });
          setLocalFlashcards(flashcards);
        } catch (error: any) {
          if (error.message === "GEMINI_UNAVAILABLE") {
            setIsFallbackGenerating(true);
            const flashcards = await generateFlashcards(
              document.content,
              customFlashcardInstructions,
              i18n.language,
              customFlashcardsLanguage || undefined
            );
            await updateDocument(document.id, { flashcards });
            setLocalFlashcards(flashcards);
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error(`Error generating ${activeTab}:`, error);
      alert(
        error instanceof Error
          ? error.message
          : "An error occurred while generating content"
      );
    } finally {
      setIsGenerating(false);
      setIsFallbackGenerating(false);
    }
  };

  const handlePrevCard = () => {
    setSlideDirection("right");
    setCurrentFlashcardIndex((prev) =>
      prev === 0 ? localFlashcards.length - 1 : prev - 1
    );
  };

  const handleNextCard = () => {
    setSlideDirection("left");
    setCurrentFlashcardIndex((prev) =>
      prev === localFlashcards.length - 1 ? 0 : prev + 1
    );
  };

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setTestAnswers((prev) => {
      const newAnswers = [...prev];
      const existingIndex = newAnswers.findIndex(
        (a) => a.questionIndex === questionIndex
      );

      if (existingIndex !== -1) {
        newAnswers[existingIndex].selectedAnswer = answer;
      } else {
        newAnswers.push({ questionIndex, selectedAnswer: answer });
      }

      return newAnswers;
    });
  };

  const handleTestSubmit = () => {
    if (testAnswers.length < localTest.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    const correctAnswers = testAnswers.reduce((count, answer) => {
      const question = localTest[answer.questionIndex];
      return count + (answer.selectedAnswer === question.correctAnswer ? 1 : 0);
    }, 0);

    const percentage = Math.round((correctAnswers / localTest.length) * 100);
    setTestScore(percentage);
    setTestSubmitted(true);
  };

  const handleGenerateAudio = async () => {
    if (!document?.content || isGeneratingAudio || !userId) {
      if (!userId) {
        alert("Please log in to generate audio");
      }
      return;
    }

    try {
      setIsGeneratingAudio(true);

      // Generate styled text using OpenAI
      const styledText = await generateStyledText(document.content, audioStyle);

      // Convert the styled text to speech using Eleven Labs
      const newAudioUrl = await generateSpeech(
        styledText,
        audioStyle,
        document.id,
        userId
      );

      // Create new audio entry
      const newAudio: AudioEntry = {
        url: newAudioUrl,
        style: audioStyle,
      };

      // Update saved audios
      const updatedAudios = [...savedAudios, newAudio];
      setSavedAudios(updatedAudios);

      // Update document with new audio
      await updateDocument(document.id, {
        audioUrl: newAudioUrl,
        audioStyle,
        additionalAudios: updatedAudios.slice(1), // Store additional audios separately
      });

      setIsGeneratingAudio(false);

      // Auto-play the new audio
      setCurrentPlayingUrl(newAudioUrl);
      if (audioRef.current) {
        try {
          await audioRef.current.play();
          setIsAudioPlaying(true);
        } catch (playError) {
          console.warn("Auto-play failed:", playError);
        }
      }
    } catch (error) {
      console.error("Error generating audio:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to generate audio. Please try again."
      );
      setIsGeneratingAudio(false);
    }
  };

  const handleTitleUpdate = async () => {
    if (!newTitle.trim() || newTitle === document.title) {
      setIsEditingTitle(false);
      setNewTitle(document.title);
      return;
    }

    try {
      const result = await updateDocumentTitle(document.id, newTitle.trim());
      if (result.success) {
        await onDocumentsChange?.();
        setIsEditingTitle(false);
      } else {
        setNewTitle(document.title);
        setIsEditingTitle(false);
      }
    } catch (error) {
      console.error("Failed to update title:", error);
      setNewTitle(document.title);
      setIsEditingTitle(false);
    }
  };

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Clean up audio URL when component unmounts or audio style changes
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const CustomInstructionsBox = useCallback(
    ({
      value,
      onChange,
      icon: Icon,
      customLanguageState,
    }: {
      value: string;
      onChange: (value: string) => void;
      icon: typeof Brain;
      customLanguageState?: [string, (value: string) => void];
    }) => {
      const [showCustomLanguage, setShowCustomLanguage] = useState(false);
      const [customLanguage, setCustomLanguage] = customLanguageState || [
        "",
        () => {},
      ];

      return (
        <div className="w-full max-w-lg mb-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 dark:from-pink-400 dark:via-purple-400 dark:to-indigo-400 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white dark:bg-gray-900 ring-1 ring-gray-200/50 dark:ring-gray-700/50 rounded-lg p-6 shadow-lg dark:shadow-gray-950/50">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  <Icon className="w-5 h-5 text-pink-500 dark:text-pink-400" />
                  {t("documentView.customInstructions.title")}
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                    {t("documentView.customInstructions.optional")}
                  </span>
                </label>
                <button
                  onClick={() => setShowCustomLanguage(!showCustomLanguage)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  {showCustomLanguage
                    ? t("documentView.customInstructions.customLanguage.hide")
                    : t("documentView.customInstructions.customLanguage.show")}
                </button>
              </div>
              {showCustomLanguage && (
                <div className="mb-3">
                  <input
                    type="text"
                    value={customLanguage}
                    onChange={(e) => setCustomLanguage(e.target.value)}
                    placeholder={t(
                      "documentView.customInstructions.customLanguage.placeholder"
                    )}
                    className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 dark:focus:ring-pink-400/50 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                    <span className="text-amber-500 dark:text-amber-400 mt-0.5">
                      *
                    </span>
                    <span>
                      {t(
                        "documentView.customInstructions.customLanguage.defaultNote"
                      )}
                    </span>
                  </div>
                </div>
              )}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      onChange(e.target.value);
                    }
                  }}
                  placeholder={t("documentView.customInstructions.placeholder")}
                  className="w-full h-32 px-4 py-3 text-gray-700 dark:text-gray-200 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50 dark:focus:ring-pink-400/50 focus:border-transparent transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  maxLength={500}
                  autoComplete="off"
                  spellCheck="false"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                  <PenLine className="w-4 h-4" />
                  <span>
                    {value.length}/500{" "}
                    {t("documentView.customInstructions.characters")}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-pink-500 dark:bg-pink-400"></div>
                {t("documentView.customInstructions.priorityNote")}
              </div>
            </div>
          </div>
        </div>
      );
    },
    [t]
  );

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-24 h-24 mb-4">
        {activeTab === "notes" && <LoadingNotes className="w-full h-full" />}
        {activeTab === "flashcards" && (
          <LoadingBrain className="w-full h-full" />
        )}
        {activeTab === "test" && <LoadingTest className="w-full h-full" />}
      </div>
      <p className="text-lg font-medium text-gray-900">
        Generating{" "}
        {activeTab === "notes"
          ? "Notes"
          : activeTab === "flashcards"
          ? "Flashcards"
          : "Test"}
        ...
      </p>
      {isFallbackGenerating && (
        <p className="mt-2 text-sm text-gray-600 text-center max-w-sm">
          We're experiencing some delays. This might take a little longer than
          usual...
        </p>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "chat":
        return (
          <Chat
            documentContent={document.content}
            documentId={document.id}
            initialMessages={chatMessages}
            onChatUpdate={(messages) => {
              handleChatUpdate(messages as unknown as ChatMessage[]).catch(
                console.error
              );
            }}
            selectedText={selectedText}
            selectedImage={selectedImage}
            onClearSelection={() => {
              setSelectedText(null);
              setSelectedImage(null);
            }}
            documentType={document.type === "youtube" ? "youtube" : undefined}
            youtubeUrl={document.youtube_link}
            onTimestampClick={handleTimestampClick}
          />
        );

      case "notes":
        if (localNotes) {
          return (
            // <EditableNote
            //   content={localNotes}
            //   onSave={async (newContent) => {
            //     try {
            //       await updateDocument(document.id, { notes: newContent });
            //       setLocalNotes(newContent);
            //       if (onDocumentsChange) {
            //         await onDocumentsChange();
            //       }
            //     } catch (error) {
            //       console.error('Error updating notes:', error);
            //       setError('Failed to update notes');
            //     }
            //   }}
            // />
            <RichTextEditor
              content={localNotes}
              onSave={async (newContent) => {
                try {
                  await updateDocument(document.id, { notes: newContent });
                  setLocalNotes(newContent);
                  if (onDocumentsChange) {
                    await onDocumentsChange();
                  }
                } catch (error) {
                  console.error("Error updating notes:", error);
                  setError("Failed to update notes");
                }
              }}
            />
            // <></>
          );
        }

        if (isGenerating) {
          return renderLoadingState();
        }

        return (
          <div className="flex flex-col items-center justify-center h-full">
            <CustomInstructionsBox
              value={customNotesInstructions}
              onChange={setCustomNotesInstructions}
              icon={PenLine}
              customLanguageState={[
                customNotesLanguage,
                setCustomNotesLanguage,
              ]}
            />
            <button
              onClick={handleGenerate}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="group relative w-32 h-32 perspective"
            >
              <div
                className={`absolute inset-0 transform transition-transform duration-500 preserve-3d ${
                  isHovered ? "rotate-y-180 scale-110" : ""
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center backface-hidden shadow-xl">
                  <PenLine className="w-16 h-16 text-white transform transition-transform group-hover:scale-110" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-teal-600 to-emerald-500 rounded-xl flex items-center justify-center backface-hidden rotate-y-180 shadow-xl">
                  <span className="text-white font-bold">
                    {t("documentView.notes.generate")}
                  </span>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
            </button>
            <p className="mt-6 text-gray-600 text-center max-w-sm">
              {t("documentView.notes.description")}
            </p>
          </div>
        );

      case "flashcards":
        if (localFlashcards?.length) {
          return (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-full max-w-2xl">
                <div className="flex justify-end gap-3 mb-8">
                  <button
                    onClick={() => {
                      const menu = window.document.createElement("div");
                      menu.id = "export-menu";
                      menu.className =
                        "fixed z-50 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5";
                      menu.innerHTML = `
                        <div class="py-1">
                          <button class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2" id="export-csv">
                            <span class="flex-1">${t(
                              "documentView.flashcards.export.toCsv"
                            )}</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">.csv</span>
                          </button>
                          <button class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2" id="export-clipboard">
                            <span class="flex-1">${t(
                              "documentView.flashcards.export.toClipboard"
                            )}</span>
                            <span class="text-xs text-gray-500 dark:text-gray-400">text</span>
                          </button>
                        </div>
                      `;

                      // Position the menu
                      const button = window.document
                        .activeElement as HTMLElement;
                      const rect = button.getBoundingClientRect();
                      menu.style.position = "fixed";
                      menu.style.top = `${rect.bottom + 5}px`;
                      menu.style.right = `${window.innerWidth - rect.right}px`;

                      window.document.body.appendChild(menu);

                      const handleClickOutside = (e: MouseEvent) => {
                        const menu =
                          window.document.getElementById("export-menu");
                        if (menu && !menu.contains(e.target as Node)) {
                          menu.remove();
                          window.removeEventListener(
                            "click",
                            handleClickOutside
                          );
                        }
                      };

                      menu
                        .querySelector("#export-csv")
                        ?.addEventListener("click", () => {
                          const menu =
                            window.document.getElementById("export-menu");
                          if (menu) menu.remove();
                          exportToCsv();
                        });

                      menu
                        .querySelector("#export-clipboard")
                        ?.addEventListener("click", () => {
                          const menu =
                            window.document.getElementById("export-menu");
                          if (menu) menu.remove();
                          exportToClipboard();
                        });

                      // Add click outside listener
                      setTimeout(() => {
                        window.addEventListener("click", handleClickOutside);
                      }, 0);
                    }}
                    className="inline-flex items-center px-3.5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 shadow-sm ring-2 ring-gray-300 dark:ring-gray-600 hover:ring-gray-400 dark:hover:ring-gray-500"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    {t("documentView.flashcards.actions.export")}
                  </button>
                  <button
                    onClick={handleAddFlashcard}
                    className="inline-flex items-center px-3.5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 shadow-sm ring-2 ring-gray-300 dark:ring-gray-600 hover:ring-gray-400 dark:hover:ring-gray-500"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    {t("documentView.flashcards.actions.new")}
                  </button>
                </div>

                <div className="relative flex items-center justify-between gap-4">
                  <button
                    onClick={handlePrevCard}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                    title={t("documentView.flashcards.navigation.previous")}
                  >
                    <ChevronLeft className="h-7 w-7 text-gray-600 dark:text-gray-400" />
                  </button>

                  <div className="flex-1 perspective-1000">
                    <div className="relative">
                      <div className="absolute -inset-3.5 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-indigo-500/20 dark:from-pink-400/10 dark:via-purple-400/10 dark:to-indigo-400/10 rounded-2xl blur-lg transition-opacity"></div>
                      <Flashcard
                        key={currentFlashcardIndex}
                        question={
                          <div className="text-center">
                            <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-4">
                              {t("documentView.flashcards.labels.question")}
                            </div>
                            <ReactMarkdown {...markdownComponents}>
                              {localFlashcards[currentFlashcardIndex].question}
                            </ReactMarkdown>
                          </div>
                        }
                        answer={
                          <div className="text-center">
                            <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-4">
                              {t("documentView.flashcards.labels.answer")}
                            </div>
                            <ReactMarkdown {...markdownComponents}>
                              {localFlashcards[currentFlashcardIndex].answer}
                            </ReactMarkdown>
                          </div>
                        }
                        rawQuestion={
                          localFlashcards[currentFlashcardIndex].question
                        }
                        rawAnswer={
                          localFlashcards[currentFlashcardIndex].answer
                        }
                        slideDirection={slideDirection}
                        onSwipe={(direction) => {
                          if (direction === "left") {
                            handleNextCard();
                          } else {
                            handlePrevCard();
                          }
                        }}
                        isEditable={true}
                        isEditing={editingIndex === currentFlashcardIndex}
                        onEdit={(newQuestion, newAnswer) =>
                          handleEditFlashcard(
                            currentFlashcardIndex,
                            newQuestion,
                            newAnswer
                          )
                        }
                        onDelete={() =>
                          handleDeleteFlashcard(currentFlashcardIndex)
                        }
                        onCancelEdit={() => setEditingIndex(null)}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleNextCard}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-300 hover:scale-110 backdrop-blur-sm"
                    title={t("documentView.flashcards.navigation.next")}
                  >
                    <ChevronRight className="h-7 w-7 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center justify-center mt-6 gap-2">
                  <div className="h-1 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 dark:from-pink-400 dark:via-purple-400 dark:to-indigo-400 transition-all duration-300"
                      style={{
                        width: `${
                          ((currentFlashcardIndex + 1) /
                            localFlashcards.length) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[80px] text-center">
                    {currentFlashcardIndex + 1} / {localFlashcards.length}
                  </span>
                </div>
              </div>
            </div>
          );
        }

        if (isGenerating) {
          return renderLoadingState();
        }

        return (
          <div className="flex flex-col items-center justify-center h-full">
            <CustomInstructionsBox
              value={customFlashcardInstructions}
              onChange={setCustomFlashcardInstructions}
              icon={Brain}
              customLanguageState={[
                customFlashcardsLanguage,
                setCustomFlashcardsLanguage,
              ]}
            />
            <button
              onClick={handleGenerate}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="group relative w-32 h-32 perspective"
            >
              <div
                className={`absolute inset-0 transform transition-transform duration-500 preserve-3d ${
                  isHovered ? "rotate-y-180 scale-110" : ""
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center backface-hidden shadow-xl">
                  <Brain className="w-16 h-16 text-white transform transition-transform group-hover:scale-110" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center backface-hidden rotate-y-180 shadow-xl">
                  <span className="text-white font-bold">
                    {t("documentView.flashcards.generate")}
                  </span>
                </div>
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
            </button>
            <p className="mt-6 text-gray-600 text-center max-w-sm">
              {t("documentView.flashcards.description")}
            </p>
          </div>
        );

      // Update the test case in renderTabContent
      case "test":
        if (localTest.length > 0) {
          if (testSubmitted) {
            return (
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-white to-purple-100 dark:from-gray-900 dark:to-gray-800 p-8 rounded-xl shadow-lg border border-purple-100 dark:border-gray-700">
                  <div className="text-center mb-8">
                    <div
                      className={`text-6xl font-bold ${
                        testScore >= 70
                          ? "text-green-600 dark:text-green-400"
                          : testScore >= 50
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {testScore}%
                    </div>
                    <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {testScore >= 90
                        ? t("documentView.test.results.score.perfect")
                        : testScore >= 80
                        ? t("documentView.test.results.score.excellent")
                        : testScore >= 70
                        ? t("documentView.test.results.score.great")
                        : testScore >= 60
                        ? t("documentView.test.results.score.good")
                        : testScore >= 50
                        ? t("documentView.test.results.score.fair")
                        : t("documentView.test.results.score.poor")}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {localTest.map((question, index) => {
                      const userAnswer = testAnswers.find(
                        (a) => a.questionIndex === index
                      )?.selectedAnswer;
                      const isCorrect = userAnswer === question.correctAnswer;

                      return (
                        <div
                          key={index}
                          className={`p-6 rounded-lg border ${
                            isCorrect
                              ? "bg-green-50 border-green-100 dark:bg-gradient-to-br dark:from-green-950/80 dark:to-emerald-950/80 dark:border-green-800/50 dark:shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                              : "bg-red-50 border-red-100 dark:bg-gradient-to-br dark:from-red-950/80 dark:to-rose-950/80 dark:border-red-800/50 dark:shadow-[0_0_25px_rgba(239,68,68,0.25)]"
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <span
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                isCorrect
                                  ? "bg-gradient-to-br from-green-500 to-emerald-500 dark:from-green-400/90 dark:to-emerald-400/90 dark:shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                  : "bg-gradient-to-br from-red-500 to-rose-500 dark:from-red-400/90 dark:to-rose-400/90 dark:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                              } text-white`}
                            >
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                <ReactMarkdown {...markdownComponents}>
                                  {question.question}
                                </ReactMarkdown>
                              </h3>
                              <div className="mt-4 space-y-2">
                                <div
                                  className={`text-sm ${
                                    isCorrect
                                      ? "text-green-700 dark:text-green-300/90"
                                      : "text-red-700 dark:text-red-300/90"
                                  }`}
                                >
                                  {t("documentView.test.results.yourAnswer")}:{" "}
                                  <ReactMarkdown {...markdownComponents}>
                                    {userAnswer}
                                  </ReactMarkdown>
                                </div>
                                {!isCorrect && (
                                  <div className="text-sm text-green-700 dark:text-green-300/90">
                                    {t(
                                      "documentView.test.results.correctAnswer"
                                    )}
                                    :{" "}
                                    <ReactMarkdown {...markdownComponents}>
                                      {question.correctAnswer}
                                    </ReactMarkdown>
                                  </div>
                                )}
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                  <ReactMarkdown {...markdownComponents}>
                                    {question.explanation}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 space-y-4">
                    <button
                      onClick={() => {
                        setTestSubmitted(false);
                        setTestAnswers([]);
                        setTestScore(0);
                      }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 text-white rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                    >
                      {t("documentView.test.buttons.tryAgain")}
                    </button>

                    <button
                      onClick={handleGenerateNewTest}
                      disabled={isGeneratingTest}
                      className="w-full px-6 py-3 bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-400 dark:from-amber-500 dark:via-orange-500 dark:to-yellow-500 text-white rounded-lg font-semibold hover:from-amber-500 hover:via-orange-500 hover:to-yellow-500 dark:hover:from-amber-600 dark:hover:via-orange-600 dark:hover:to-yellow-600 transition-all duration-200 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingTest
                        ? "Generating..."
                        : t("documentView.test.buttons.generateNew")}
                    </button>
                  </div>

                  {/* Display previous test sets */}
                  {testSets.length > 1 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                        {t("documentView.test.previousTests.title")}
                      </h3>
                      <div className="space-y-4">
                        {testSets.slice(0, -1).map((testSet, index) => (
                          <div
                            key={testSet.createdAt}
                            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                            onClick={() => {
                              setLocalTest(testSet.questions);
                              setTestAnswers([]);
                              setTestScore(0);
                              setTestSubmitted(false);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {t("documentView.test.previousTests.number", {
                                    number: testSets.length - 1 - index,
                                  })}
                                </span>
                                {testSet.instructions && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    {testSet.instructions}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(
                                  testSet.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-8">
              {/* Add Back Button */}
              <button
                onClick={() => {
                  setLocalTest([]);
                  setTestAnswers([]);
                  setTestScore(0);
                  setTestSubmitted(false);
                  setIsGenerating(false);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {localTest.map((question, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-white to-purple-100 dark:from-gray-900 dark:to-gray-800 p-8 rounded-xl shadow-lg border border-purple-100 dark:border-gray-700 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                >
                  <div className="flex items-start space-x-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex-1">
                      <ReactMarkdown {...markdownComponents}>
                        {question.question}
                      </ReactMarkdown>
                    </h3>
                  </div>

                  <div className="mt-6 pl-12">
                    {question.type === "multiple_choice" ? (
                      <div className="space-y-3">
                        {question.options?.map((option, optionIndex) => (
                          <label
                            key={optionIndex}
                            className="relative flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/30 cursor-pointer transform transition-all duration-200 hover:scale-[1.01] hover:shadow-md group"
                          >
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value={option}
                              checked={
                                testAnswers.find(
                                  (a) => a.questionIndex === index
                                )?.selectedAnswer === option
                              }
                              onChange={() => handleAnswerSelect(index, option)}
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-offset-2"
                            />
                            <span className="ml-3 text-gray-800 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                              <ReactMarkdown {...markdownComponents}>
                                {option}
                              </ReactMarkdown>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-purple-500/5 group-hover:to-purple-500/0 rounded-lg transition-all duration-500 pointer-events-none" />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex space-x-6">
                        {["True", "False"].map((option) => (
                          <label
                            key={option}
                            className="relative flex-1 flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-800/30 cursor-pointer transform transition-all duration-200 hover:scale-[1.01] hover:shadow-md group"
                          >
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value={option}
                              checked={
                                testAnswers.find(
                                  (a) => a.questionIndex === index
                                )?.selectedAnswer === option
                              }
                              onChange={() => handleAnswerSelect(index, option)}
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500 focus:ring-offset-2"
                            />
                            <span className="ml-3 text-gray-800 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                              <ReactMarkdown {...markdownComponents}>
                                {t(
                                  `documentView.test.options.${option.toLowerCase()}`
                                )}
                              </ReactMarkdown>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-purple-500/5 group-hover:to-purple-500/0 rounded-lg transition-all duration-500 pointer-events-none" />
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="mt-8">
                <button
                  onClick={handleTestSubmit}
                  className="w-full px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 text-white rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                >
                  {t("documentView.test.buttons.submit")}
                </button>
              </div>
            </div>
          );
        }
        if (isGenerating) {
          return renderLoadingState();
        }

        return (
          <div className="flex flex-col items-center justify-center h-full">
            {/* Show test sets first if they exist */}
            {testSets.length > 0 && (
              <div className="w-full max-w-2xl mx-auto mb-8">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 dark:from-amber-400/20 dark:via-yellow-400/20 dark:to-amber-400/20 rounded-lg blur opacity-25"></div>
                  <div className="relative bg-white dark:bg-gray-900 ring-1 ring-gray-200/50 dark:ring-gray-700/50 rounded-lg p-4 shadow-lg dark:shadow-gray-950/50">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <BookOpen className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                      {t("documentView.testSets.title")}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        ({testSets.length} {t("documentView.testSets.of")} 4{" "}
                        {t("documentView.testSets.sets")})
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {testSets.map((testSet, index) => (
                        <button
                          key={testSet.createdAt}
                          onClick={() => {
                            setLocalTest(testSet.questions);
                            setTestAnswers([]);
                            setTestScore(0);
                            setTestSubmitted(false);
                            if (testSet.instructions) {
                              setCustomTestInstructions(testSet.instructions);
                            }
                          }}
                          className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 border border-amber-100 dark:border-amber-800/30 rounded-xl hover:from-amber-100 hover:to-yellow-100 dark:hover:from-amber-900/50 dark:hover:to-yellow-900/50 transition-all duration-200 text-left group relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 dark:from-amber-400/5 dark:to-yellow-400/5 rounded-bl-[100px] transition-all duration-300 group-hover:scale-110" />
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 dark:from-amber-400 dark:to-yellow-400 text-white flex items-center justify-center font-bold text-sm shadow-lg dark:shadow-amber-400/20">
                                {testSets.length - index}
                              </div>
                              <span className="font-medium text-amber-900 dark:text-amber-100 text-sm">
                                {t("documentView.testSets.testSet")}
                              </span>
                            </div>
                            {testSet.instructions && (
                              <p className="text-xs text-amber-700 dark:text-amber-300/90 mb-2 line-clamp-2 leading-relaxed">
                                {testSet.instructions}
                              </p>
                            )}
                            <div className="text-xs text-amber-600 dark:text-amber-400/80">
                              {new Date(testSet.createdAt).toLocaleDateString()}
                            </div>
                            <div className="mt-1 flex items-center text-xs text-amber-700 dark:text-amber-300/80">
                              <span>
                                {testSet.questions.length}{" "}
                                {t("documentView.testSets.questions")}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show test generation UI only if less than 4 tests */}
            {testSets.length < 4 ? (
              <>
                <CustomInstructionsBox
                  value={customTestInstructions}
                  onChange={setCustomTestInstructions}
                  icon={HelpCircle}
                  customLanguageState={[
                    customTestLanguage,
                    setCustomTestLanguage,
                  ]}
                />

                <button
                  onClick={handleGenerate}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="group relative w-32 h-32 perspective"
                >
                  <div
                    className={`absolute inset-0 transform transition-transform duration-500 preserve-3d ${
                      isHovered ? "rotate-y-180 scale-110" : ""
                    }`}
                  >
                    <div className="absolute inset-0 bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-amber-500 via-yellow-500 to-amber-500 rounded-xl flex items-center justify-center backface-hidden shadow-xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/50 to-transparent animate-[spin_4s_linear_infinite]" />
                      <div className="absolute inset-0 bg-gradient-to-tl from-yellow-400/50 to-transparent animate-[spin_4s_linear_infinite_reverse]" />
                      <HelpCircle className="w-16 h-16 text-white transform transition-transform group-hover:scale-110 relative z-10" />
                    </div>
                    <div className="absolute inset-0 bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-yellow-500 via-amber-500 to-yellow-500 rounded-xl flex items-center justify-center backface-hidden rotate-y-180 shadow-xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/50 to-transparent animate-[spin_4s_linear_infinite]" />
                      <div className="absolute inset-0 bg-gradient-to-tl from-amber-400/50 to-transparent animate-[spin_4s_linear_infinite_reverse]" />
                      <span className="text-white font-bold relative z-10">
                        {t("documentView.test.generate")}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
                </button>
                <p className="mt-6 text-gray-600 text-center max-w-sm">
                  {t("documentView.test.description")}
                </p>
              </>
            ) : null}
          </div>
        );

      case "vocalize":
        return <VocalizeTab document={document} onUpdate={onDocumentsChange} />;

      default:
        return null;
    }
  };

  const handleGenerateNewTest = async () => {
    setIsGeneratingTest(true);
    try {
      // Reset test state but keep testSets
      setLocalTest([]);
      setTestAnswers([]);
      setTestScore(0);
      setTestSubmitted(false);
      setCustomTestInstructions("");

      // This will show the test generation page with custom instructions field
      setIsGenerating(false);
    } catch (error) {
      console.error("Error handling test state:", error);
      alert("Failed to reset test state. Please try again.");
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const handleAddFlashcard = () => {
    const newFlashcard = {
      question: "",
      answer: "",
    };
    const newIndex = localFlashcards.length;
    setLocalFlashcards([...localFlashcards, newFlashcard]);
    setCurrentFlashcardIndex(newIndex);
    setEditingIndex(newIndex);
  };

  const handleEditFlashcard = (
    index: number,
    newQuestion: string,
    newAnswer: string
  ) => {
    // If we're starting edit mode, just set the editing index
    if (
      newQuestion === localFlashcards[index].question &&
      newAnswer === localFlashcards[index].answer
    ) {
      setEditingIndex(index);
      return;
    }

    // Otherwise, save the changes
    const updatedFlashcards = [...localFlashcards];
    updatedFlashcards[index] = { question: newQuestion, answer: newAnswer };
    setLocalFlashcards(updatedFlashcards);
    setEditingIndex(null);

    // Update in Firestore
    if (document) {
      updateDocument(document.id, { flashcards: updatedFlashcards });
    }
  };

  const handleDeleteFlashcard = (index: number) => {
    const updatedFlashcards = [...localFlashcards];
    updatedFlashcards.splice(index, 1);
    setLocalFlashcards(updatedFlashcards);

    // Update the current index if necessary
    if (index === currentFlashcardIndex && updatedFlashcards.length > 0) {
      if (index === updatedFlashcards.length) {
        setCurrentFlashcardIndex(index - 1);
      }
    } else if (updatedFlashcards.length === 0) {
      setCurrentFlashcardIndex(0);
    }

    // Update in Firestore
    if (document) {
      updateDocument(document.id, { flashcards: updatedFlashcards });
    }
  };

  const exportToCsv = () => {
    try {
      // Create CSV content
      const csvContent = [
        ["Question", "Answer"], // CSV header
        ...localFlashcards.map((card) => [
          // Escape quotes and wrap fields in quotes
          `"${card.question.replace(/"/g, '""')}"`,
          `"${card.answer.replace(/"/g, '""')}"`,
        ]),
      ].join("\n");

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${document?.title || "flashcards"}.csv`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      alert(t("documentView.flashcards.exportError"));
    }
  };

  const exportToClipboard = () => {
    try {
      // Create text content
      const textContent = localFlashcards
        .map((card) => `Question: ${card.question}\nAnswer: ${card.answer}\n`)
        .join("\n");

      // Copy to clipboard
      navigator.clipboard
        .writeText(textContent)
        .then(() => {
          alert(t("documentView.flashcards.copySuccess"));
        })
        .catch((error) => {
          console.error("Error copying to clipboard:", error);
          alert(t("documentView.flashcards.copyError"));
        });
    } catch (error) {
      console.error("Error preparing text for clipboard:", error);
      alert(t("documentView.flashcards.copyError"));
    }
  };

  return (
    <div
      className={`
      w-full h-[92vh] md:h-[calc(100vh-4rem)] flex flex-col
    `}
    >
      <div className="flex-1 relative overflow-hidden">
        {error && (
          <div className="absolute top-4 right-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg flex items-center gap-2 animate-slideUp">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <PanelGroup
          direction={isMobile ? "vertical" : "horizontal"}
          className="h-full"
        >
          {isPdfVisible && (
            <>
              <Panel
                defaultSize={isMobile && document.type === "youtube" ? 35 : 50}
                minSize={
                  isMobile && document.type === "youtube"
                    ? 30
                    : isMobile
                    ? 40
                    : 30
                }
              >
                <div
                  className={`h-full bg-gray-100 dark:bg-black overflow-hidden relative`}
                >
                  {document.type === "youtube" ? (
                    document.youtube_link ? (
                      <YoutubeViewer
                        url={document.youtube_link}
                        onPlayerReady={setYoutubePlayerRef}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 dark:text-gray-400">
                          YouTube URL not available
                        </p>
                      </div>
                    )
                  ) : document.type === "lecture" ? (
                    <LectureTranscript
                      content={document.content}
                      documentId={document.id}
                      audioUrl={document.audioUrl}
                      onTranscriptUpdate={handleTranscriptUpdate}
                    />
                  ) : document.fileUrl ? (
                    <PdfViewer
                      url={document.fileUrl}
                      scale={scale}
                      onScaleChange={setScale}
                      onTextSelect={(text) => {
                        setSelectedText(text);
                        setSelectedImage(null);
                        setActiveTab("chat");
                      }}
                      onAreaSelect={(imageData) => {
                        setSelectedImage(imageData);
                        setSelectedText(null);
                        setActiveTab("chat");
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 dark:text-gray-400">
                        No file available
                      </p>
                    </div>
                  )}
                </div>
              </Panel>
              {!isMobile && (
                <PanelResizeHandle className="w-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                  <div className="w-1 h-8 bg-gray-400 dark:bg-gray-600 rounded-full mx-auto my-2" />
                </PanelResizeHandle>
              )}
              {isMobile && (
                <div className="h-[1px] bg-gray-200 dark:bg-gray-800 w-full" />
              )}
            </>
          )}

          {/* Content Panel */}
          <Panel minSize={isMobile ? 50 : 30}>
            <div className="h-full flex flex-col bg-white dark:bg-gray-900">
              {/* Header */}
              <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 px-4 md:px-6 py-2 md:py-4">
                <div className="flex justify-between items-center mb-2 md:mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPdfVisible(!isPdfVisible)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      title={
                        isPdfVisible
                          ? t("documentView.actions.hideDocument")
                          : t("documentView.actions.showDocument")
                      }
                    >
                      {isPdfVisible ? (
                        <PanelLeftClose className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <PanelLeftOpen className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                    {/* Hide title on mobile */}
                    <div className="hidden md:block">
                      {isEditingTitle ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleTitleUpdate();
                          }}
                          className="flex-1"
                        >
                          <input
                            ref={titleInputRef}
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onBlur={handleTitleUpdate}
                            className="w-full px-2 py-1 text-xl md:text-2xl font-bold text-gray-900 dark:text-white border-b-2 border-indigo-500 focus:outline-none focus:border-indigo-600 bg-transparent"
                            placeholder="Enter document title..."
                          />
                        </form>
                      ) : (
                        <h1
                          className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group flex items-center gap-2"
                          onClick={() => setIsEditingTitle(true)}
                          title="Click to rename"
                        >
                          {document.title}
                          <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h1>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {document.fileUrl && (
                      <a
                        href={document.fileUrl}
                        download={document.title}
                        className="inline-flex items-center px-3 py-1.5 md:px-4 md:py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors"
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        <span className="hidden md:inline">
                          {t("documentView.actions.download")}
                        </span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Tabs with scroll buttons */}
                <div className="relative -mb-[1px]">
                  <div className="flex items-center justify-between">
                    <div
                      ref={tabsContainerRef}
                      className="flex overflow-x-auto overflow-y-hidden whitespace-nowrap border-b border-gray-200 dark:border-gray-800 scrollbar-hide"
                    >
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`inline-flex items-center shrink-0 gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === tab.id
                              ? "text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900 border-t border-x border-gray-200 dark:border-gray-800"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                          style={{
                            marginBottom: "-1px",
                            borderBottom:
                              activeTab === tab.id
                                ? "1px solid var(--tw-bg-opacity)"
                                : undefined,
                          }}
                        >
                          <tab.icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                          {tab.beta && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-400/10 dark:to-purple-400/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-200/20 dark:border-indigo-400/20">
                              BETA
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div
                className={`flex-1 min-h-0 overflow-auto p-4 md:p-6 ${
                  !isMobile && activeTab === "notes"
                    ? "max-h-[calc(100vh-8rem)]"
                    : ""
                }`}
              >
                <div
                className={`${
                  isMobile && activeTab === "notes"
                    ? "max-w-[100vw] break-words overflow-x-hidden [&_table]:overflow-x-auto [&_table]:max-w-full [&_table]:block [&_table]:w-fit"
                    : ""
                }`}
                >
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

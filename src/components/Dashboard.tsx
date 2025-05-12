import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileUp,
  Loader2,
  Computer,
  AlertCircle,
  Youtube,
  FileText,
  Pencil,
  Trash2,
  Mic,
  ArrowRight,
  Clock,
  BarChart2,
  Upload,
  FolderOpen,
  Plus,
  MoreVertical,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import {
  saveDocument,
  updateDocumentTitle,
  deleteDocument,
  type Document,
  getUserSubjects,
  addSubject,
  updateDocumentSubject,
  deleteSubject,
  renameSubject
} from '../lib/firestore';
import { extractTextFromPDF } from '../lib/pdf';
import { getYoutubeTranscript } from '../lib/apify';
import { motion } from 'framer-motion';
import DeleteModal from './DeleteModal';
import DeleteAnimation from './DeleteAnimation';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  PLAN_UPLOAD_LIMITS,
  checkUploadLimit,
  getUploadUsage,
  incrementUploadCount
} from '../lib/uploadLimits';
import { ReferralSourceModal } from './ReferralSourceModal';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { validateYoutubeUrl } from '../lib/youtube';
import { useUpdateNotification } from '../hooks/useUpdateNotification';
import { useLanguageModal } from '../hooks/useLanguageModal';
import LanguageSelectionModal from './LanguageSelectionModal';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction
} from './ui/alert-dialog';

interface DashboardProps {
  documents?: Document[];
  onDocumentsChange?: () => Promise<void>;
  currentSubject?: string;
  showSubjects?: boolean;
}

export default function Dashboard({ documents = [], onDocumentsChange, currentSubject, showSubjects = true }: DashboardProps) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile] = useState(() => window.innerWidth <= 768);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isProcessingYoutube, setIsProcessingYoutube] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const { plan } = useSubscription();
  const [uploadUsage, setUploadUsage] = useState({ documents: 0, lectures: 0 });
  const limits = PLAN_UPLOAD_LIMITS[plan];
  const { isOpen: isLanguageModalOpen, closeModal: closeLanguageModal } = useLanguageModal();
  const [hasCheckedModals, setHasCheckedModals] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('All Documents');
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const newSubjectInputRef = useRef<HTMLInputElement>(null);
  const [draggedDocument, setDraggedDocument] = useState<Document | null>(null);
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const location = useLocation();
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');
  const [showDeleteSubjectModal, setShowDeleteSubjectModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [openDocMenu, setOpenDocMenu] = useState<string | null>(null);
  const [showMoveToSubject, setShowMoveToSubject] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const menuContentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useUpdateNotification();

  useEffect(() => {
    const loadUsage = async () => {
      if (userId) {
        const usage = await getUploadUsage(userId);
        setUploadUsage(usage);
      }
    };
    loadUsage();
  }, [userId]);

  useEffect(() => {
    const checkModals = async () => {
      if (!userId || hasCheckedModals) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data();
        
        // First show referral modal if needed
        if (!userData?.hasSeenReferralModal) {
          setShowReferralModal(true);
          // Language modal will be shown after referral modal is closed
          // (handled by the ReferralSourceModal onClose callback)
        }
        
        setHasCheckedModals(true);
      } catch (error) {
        console.error('Error checking modal status:', error);
      }
    };
    
    checkModals();
  }, [userId, hasCheckedModals]);

  useEffect(() => {
    // Set loading to false after a short delay to show animation
    const timer = setTimeout(() => {
      setIsLoadingDocuments(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAddingSubject && newSubjectInputRef.current) {
      newSubjectInputRef.current.focus();
    }
  }, [isAddingSubject]);

  useEffect(() => {
    const loadSubjects = async () => {
      if (userId) {
        const userSubjects = await getUserSubjects(userId);
        setSubjects(userSubjects);
      }
    };
    loadSubjects();
  }, [userId]);

  // Update selectedSubject based on the current route
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/subject/')) {
      const subject = decodeURIComponent(path.split('/subject/')[1]);
      // Capitalize first letter of each word
      const formattedSubject = subject.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setSelectedSubject(formattedSubject);
    } else {
      setSelectedSubject('All Documents');
    }
  }, [location]);

  const handleYoutubeImport = async () => {
    if (!userId) {
      setError(t('dashboard.errors.login'));
      return;
    }

    if (!youtubeUrl.trim()) {
      setError(t('dashboard.errors.youtube.url'));
      return;
    }

    if (!validateYoutubeUrl(youtubeUrl)) {
      setError(t('dashboard.errors.youtube.invalid'));
      return;
    }

    let limitCheck;

    try {
      // Check upload limits first
      limitCheck = await checkUploadLimit(userId, 'document', plan);
      if (!limitCheck.allowed) {
        setError(limitCheck.error || t('dashboard.errors.limit'));
        return;
      }

      setIsProcessingYoutube(true);
      setError(null);

      // Process the video first
      const documentId = await getYoutubeTranscript(youtubeUrl, userId, selectedSubject !== 'All Documents' ? selectedSubject : undefined);
      
      if (documentId) {
        // Only increment counter after successful transcript processing
        if (limitCheck.currentCount !== undefined && limitCheck.lastReset) {
          await incrementUploadCount(userId, 'document', limitCheck.currentCount, limitCheck.lastReset);
        }
        
        setYoutubeUrl('');
        await onDocumentsChange?.();
        const updatedUsage = await getUploadUsage(userId);
        setUploadUsage(updatedUsage);
        navigate(`/document/${documentId}`);
      } else {
        throw new Error('Failed to process YouTube video');
      }
    } catch (err) {
      console.error('YouTube import error:', err);
      
      // More specific error messages based on the error type
      if (err instanceof Error) {
        const message = err.message;
        if (message === 'NO_TRANSCRIPT_AVAILABLE') {
          setError(t('dashboard.errors.youtube.noTranscript'));
        } else if (message === 'CAPTIONS_NOT_FOUND') {
          setError(t('dashboard.errors.youtube.noTranscript'));
        } else if (message.includes('network') || message.includes('internet') || message.includes('connection')) {
          setError(t('dashboard.errors.youtube.networkError'));
        } else {
          // If it's a specific error message from the API, show it, otherwise show generic error
          setError(message.startsWith('Error:') ? message : t('dashboard.errors.youtube.unexpectedError'));
        }
      } else {
        setError(t('dashboard.errors.youtube.unexpectedError'));
      }
    } finally {
      setIsProcessingYoutube(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!userId) {
      setError(t('dashboard.errors.login'));
      return;
    }
  
    // Validate file type more strictly
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setError(t('dashboard.errors.pdf.invalid'));
      return;
    }
  
    const maxFileSize = PLAN_UPLOAD_LIMITS[plan].maxFileSize * 1024 * 1024;
    if (file.size > maxFileSize) {
      setError(t('dashboard.errors.pdf.size', { size: PLAN_UPLOAD_LIMITS[plan].maxFileSize }));
      return;
    }

    let hasIncrementedCounter = false;
    let limitCheck;
  
    try {
      // Check upload limits first
      limitCheck = await checkUploadLimit(userId, 'document', plan, file.size);
      if (!limitCheck.allowed) {
        setError(limitCheck.error || t('dashboard.errors.limit'));
        return;
      }
  
      setIsProcessing(true);
      setError(null);

      // Phase 1: Increment counter before starting the upload
      if (limitCheck.currentCount !== undefined && limitCheck.lastReset) {
        await incrementUploadCount(userId, 'document', limitCheck.currentCount, limitCheck.lastReset);
        hasIncrementedCounter = true;
      }

      setUploadProgress(t('dashboard.upload.pdf.readingPdf'));
  
      // Read the file as ArrayBuffer
      const pdfBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
      });

      // Extract text from PDF with better error handling
      const text = await extractTextFromPDF(pdfBuffer).catch(error => {
        if (error.message.includes('password')) {
          throw new Error('password');
        } else if (error.message.includes('corrupt') || error.message.includes('invalid')) {
          throw new Error('corrupt');
        } else if (error.message.includes('empty')) {
          throw new Error('empty');
        }
        throw error;
      });

      if (!text.trim()) {
        throw new Error('empty');
      }
  
      setUploadProgress(t('dashboard.upload.pdf.saving'));
  
      const document = {
        title: file.name.replace(/\.pdf$/i, ''),
        content: text,
        summary: '',
        notes: '',
        flashcards: [],
        chatHistory: [],
        test: [],
        testSets: [],
        userId,
        type: 'pdf' as const,
        subject: currentSubject || selectedSubject
      };
  
      const result = await saveDocument(document, file);
  
      if (result.documentId) {
        await onDocumentsChange?.();
        const updatedUsage = await getUploadUsage(userId);
        setUploadUsage(updatedUsage);
        navigate(`/document/${result.documentId}`);
      } else {
        throw new Error('upload');
      }
    } catch (err) {
      console.error('Document upload error:', err);

      // If we incremented the counter but failed to process, roll it back
      if (hasIncrementedCounter && userId && limitCheck?.lastReset) {
        try {
          const currentUsage = await getUploadUsage(userId);
          if (currentUsage.documents > 0) {
            // Roll back the counter by decrementing it
            await setDoc(doc(db, 'uploadUsage', userId), {
              documents: {
                count: currentUsage.documents - 1,
                lastReset: limitCheck.lastReset
              }
            }, { merge: true });
          }
        } catch (rollbackErr) {
          console.error('Failed to roll back upload count:', rollbackErr);
        }
      }

      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        if (message.includes('network') || message.includes('internet') || message.includes('connection')) {
          setError(t('dashboard.errors.pdf.networkError'));
        } else if (message === 'password') {
          setError(t('dashboard.errors.pdf.password'));
        } else if (message === 'corrupt') {
          setError(t('dashboard.errors.pdf.corrupt'));
        } else if (message === 'empty') {
          setError(t('dashboard.errors.pdf.empty'));
        } else if (message === 'upload') {
          setError(t('dashboard.errors.pdf.upload'));
        } else if (message.includes('storage') || message.includes('quota')) {
          setError(t('dashboard.errors.pdf.storage'));
        } else {
          setError(t('dashboard.errors.pdf.unexpectedError'));
        }
      } else {
        setError(t('dashboard.errors.pdf.unexpectedError'));
      }
    } finally {
      setIsProcessing(false);
      setUploadProgress('');
    }
  };

  const handleTitleUpdate = async (docId: string) => {
    if (
      !editingTitle.trim() ||
      editingTitle === documents.find((d) => d.id === docId)?.title
    ) {
      setEditingDocId(null);
      return;
    }

    try {
      const result = await updateDocumentTitle(docId, editingTitle.trim());
      if (result.success) {
        await onDocumentsChange?.();
      }
    } catch (error) {
      console.error('Failed to update title:', error);
    } finally {
      setEditingDocId(null);
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete?.id || !userId) return;

    try {
      setDeletingId(documentToDelete.id);

      const result = await deleteDocument(documentToDelete.id);
      if (result.success) {
        await onDocumentsChange?.();
        const updatedUsage = await getUploadUsage(userId);
        setUploadUsage(updatedUsage);
      } else {
        setError(t('dashboard.errors.document.deleteFailed'));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setError(t('dashboard.errors.document.deleteFailed'));
    } finally {
      setDeletingId(null);
      setDocumentToDelete(null);
      setShowDeleteModal(false);
    }
  };

  useEffect(() => {
    if (editingDocId && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingDocId]);

  const handleAddSubject = async (subjectName: string) => {
    if (!userId || !subjectName.trim()) {
      setIsAddingSubject(false);
      setNewSubjectName('');
      return;
    }

    try {
      const result = await addSubject(userId, subjectName.trim());
      if (result.success) {
        setSubjects(prev => [...prev, subjectName.trim()]);
        setIsAddingSubject(false);
        setNewSubjectName('');
      } else {
        setError(result.error || 'Failed to add subject');
      }
    } catch (err) {
      setError('Failed to add subject');
    }
  };

  const handleDragStart = (doc: Document) => {
    setDraggedDocument(doc);
    setIsDraggingDoc(true);
  };

  const handleDragEnd = () => {
    setDraggedDocument(null);
    setIsDraggingDoc(false);
  };

  const handleSubjectDrop = async (subject: string) => {
    if (!draggedDocument) return;

    try {
      // If dropping on the same subject, do nothing
      if (draggedDocument.subject?.toLowerCase() === subject.toLowerCase()) {
        setDraggedDocument(null);
        setIsDraggingDoc(false);
        return;
      }

      const result = await updateDocumentSubject(draggedDocument.id, subject);
      if (result.success) {
        // Update the document's subject locally before refreshing
        const updatedDocs = documents.map(doc => {
          if (doc.id === draggedDocument.id) {
            return { ...doc, subject: subject };
          }
          return doc;
        });
        // Force a refresh of the documents
        await onDocumentsChange?.();
        setError(null);
      } else {
        setError(result.error || 'Failed to move document');
      }
    } catch (error) {
      setError('Failed to move document');
    }
    setDraggedDocument(null);
    setIsDraggingDoc(false);
  };

  const handleMoveToSubject = async (docId: string, newSubject: string) => {
    try {
      await updateDocumentSubject(docId, newSubject);
      await onDocumentsChange?.();
      setOpenDocMenu(null);
      setShowMoveToSubject(null);
    } catch (error) {
      console.error('Error moving document:', error);
      setError(t('dashboard.errors.moveDocument'));
    }
  };

  const handleRenameSubject = async (oldName: string, newName: string) => {
    if (!userId || !newName.trim() || newName.trim() === oldName) {
      setEditingSubject(null);
      setEditingSubjectName('');
      return;
    }

    try {
      const result = await renameSubject(userId, oldName, newName.trim());
      if (result.success) {
        setSubjects(prev => prev.map(s => s === oldName ? newName.trim() : s));
        await onDocumentsChange?.();
      } else {
        setError(result.error || 'Failed to rename subject');
      }
    } catch (err) {
      setError('Failed to rename subject');
    }
    setEditingSubject(null);
    setEditingSubjectName('');
  };

  const handleDeleteSubject = async (subject: string) => {
    try {
      if (!userId) return;
      
      // Delete the subject from the database
      const result = await deleteSubject(userId, subject);
      if (!result.success) {
        throw new Error(result.error);
      }

      // Update UI state
      setSubjects(prev => prev.filter(s => s !== subject));
      await onDocumentsChange?.();
      setShowDeleteSubjectModal(false);
      setSubjectToDelete(null);
    } catch (err) {
      setError('Failed to delete subject');
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showMoveToSubject) {
        const subjectMenuRef = menuContentRefs.current[`${showMoveToSubject}-subject`];
        if (!subjectMenuRef || !subjectMenuRef.contains(event.target as Node)) {
          setShowMoveToSubject(null);
        }
      } else if (openDocMenu) {
        const menuRef = menuRefs.current[openDocMenu];
        const menuContentRef = menuContentRefs.current[openDocMenu];
        if ((!menuRef || !menuRef.contains(event.target as Node)) && 
            (!menuContentRef || !menuContentRef.contains(event.target as Node))) {
          setOpenDocMenu(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDocMenu, showMoveToSubject]);

  const filteredDocuments = documents.filter(doc => {
    if (selectedSubject === 'All Documents') {
      // Show documents that are either unassigned or explicitly assigned to All Documents
      return !doc.subject || doc.subject === 'All Documents';
    }
    // Case-insensitive comparison for subject names
    return doc.subject && doc.subject.toLowerCase() === selectedSubject.toLowerCase();
  });

  const nonYoutubeDocuments = filteredDocuments.filter(doc => doc.type !== 'youtube');
  const youtubeDocuments = filteredDocuments.filter(doc => doc.type === 'youtube');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Mobile Device Notice - Sticky Banner */}
      {isMobile && (
        <div className="fixed top-16 inset-x-0 z-40">
        </div>
      )}

      {/* Delete Animation Container */}
      {deletingId && <DeleteAnimation />}

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!deletingId) {
            setShowDeleteModal(false);
            setDocumentToDelete(null);
          }
        }}
        onConfirm={handleDeleteDocument}
        fileName={documentToDelete?.title || ''}
        isDeleting={!!deletingId}
      />

      {showReferralModal && userId && (
        <ReferralSourceModal
          userId={userId}
          onClose={() => {
            setShowReferralModal(false);
            // Show language modal after referral modal is closed
            if (!localStorage.getItem('hasSelectedLanguage')) {
              // Add a small delay for better UX
              setTimeout(() => {
                closeLanguageModal();
              }, 500);
            }
          }}
        />
      )}

      {isLanguageModalOpen && (
        <LanguageSelectionModal 
          isOpen={isLanguageModalOpen} 
          onClose={closeLanguageModal} 
        />
      )}

      {showDeleteSubjectModal && subjectToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-4">{t('dashboard.subjects.delete.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('dashboard.subjects.delete.message')}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteSubjectModal(false);
                  setSubjectToDelete(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg"
              >
                {t('dashboard.subjects.delete.cancel')}
              </button>
              <button
                onClick={() => handleDeleteSubject(subjectToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                {t('dashboard.subjects.delete.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Combined Document Upload Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{t('dashboard.upload.title')}</h2>
          
          {/* YouTube Import */}
          <div className="mb-6">
            <div className="relative">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder={t('dashboard.upload.youtube.placeholder')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={isProcessingYoutube}
                />
                <button
                  onClick={handleYoutubeImport}
                  disabled={isProcessingYoutube}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingYoutube ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Youtube className="h-5 w-5" />
                      {t('dashboard.upload.youtube.import')}
                    </>
                  )}
                </button>
              </div>
              <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 dark:text-red-400 h-5 w-5" />
            </div>
          </div>

          {/* PDF Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer transform hover:scale-[1.01] ${
              isDragging 
                ? 'border-indigo-400 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-900/20' 
                : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isProcessing) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (!isProcessing && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                handleFileUpload(file);
              }
            }}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-spin" />
                <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-gray-100">{uploadProgress}</p>
              </div>
            ) : (
              <>
                <FileUp className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                <div className="mt-4 flex flex-col items-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                          // Reset the input value to allow uploading the same file again
                          e.target.value = '';
                        }
                      }}
                    />
                    <div
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2"
                    >
                      <Upload className="h-5 w-5" />
                      {t('dashboard.upload.pdf.button')}
                    </div>
                  </label>
                  <span className="text-gray-500 dark:text-gray-400 mt-2">{t('dashboard.upload.pdf.dragDrop')}</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('dashboard.upload.pdf.maxSize', { size: PLAN_UPLOAD_LIMITS[plan].maxFileSize })}
                </p>
              </>
            )}
          </div>

          {/* Document Upload Limit Bar */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('dashboard.limits.documents.title')}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {uploadUsage.documents} / {limits.weeklyDocuments === Infinity ? t('dashboard.limits.documents.unlimited') : limits.weeklyDocuments}
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                style={{ 
                  width: limits.weeklyDocuments === Infinity 
                    ? '100%' 
                    : `${(uploadUsage.documents / limits.weeklyDocuments) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Record Live Lecture Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">{t('dashboard.record.title')}</h2>
          <div className="flex flex-col items-center justify-center">
            <Link
              to={{
                pathname: "/record",
                search: currentSubject && currentSubject !== 'All Documents' ? `?subject=${encodeURIComponent(currentSubject)}` : ''
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 flex items-center justify-center gap-2 group transform hover:scale-[1.02]"
            >
              <Mic className="h-5 w-5 transition-transform group-hover:scale-110" />
              {t('dashboard.record.start')}
            </Link>
            <p className="mt-4 text-sm text-center text-gray-500">
              {t('dashboard.record.description')}
            </p>
          </div>

          {/* Lecture Recording Limit Bar */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('dashboard.limits.lectures.title')}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {uploadUsage.lectures} / {limits.monthlyLectures}
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${(uploadUsage.lectures / limits.monthlyLectures) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">{t('profile.error')}</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            {error.includes('limit') && (
              <Link
                to="/pricing"
                className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
              >
                {t('dashboard.errors.upgrade')}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Subjects Section */}
      {showSubjects && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              {t('dashboard.subjects.title')}
            </h2>
            <button
              onClick={() => setIsAddingSubject(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('dashboard.subjects.add')}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {subjects.length === 0 && !isAddingSubject ? (
              <button
                onClick={() => {
                  setIsAddingSubject(true);
                  setNewSubjectName('');
                }}
                className="h-[140px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
              >
                <Plus className="w-8 h-8 text-gray-400 dark:text-gray-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-300" />
                <span className="text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                  {t('dashboard.subjects.add')}
                </span>
              </button>
            ) : null}
            {isAddingSubject && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddSubject(newSubjectName);
                  }}
                  className="flex items-center gap-3"
                >
                  <FolderOpen className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    placeholder={t('dashboard.subjects.newPlaceholder')}
                    className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    autoFocus
                    onBlur={() => {
                      if (newSubjectName.trim()) {
                        handleAddSubject(newSubjectName);
                      } else {
                        setIsAddingSubject(false);
                        setNewSubjectName('');
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsAddingSubject(false);
                        setNewSubjectName('');
                      }
                    }}
                  />
                </form>
              </div>
            )}
            {subjects.map((subject) => (
              <div
                key={subject}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (draggedDocument && draggedDocument.subject !== subject) {
                    e.currentTarget.classList.add('ring-2', 'ring-indigo-500', 'ring-opacity-50', 'bg-indigo-50', 'dark:bg-indigo-900/20');
                  }
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('ring-2', 'ring-indigo-500', 'ring-opacity-50', 'bg-indigo-50', 'dark:bg-indigo-900/20');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('ring-2', 'ring-indigo-500', 'ring-opacity-50', 'bg-indigo-50', 'dark:bg-indigo-900/20');
                  handleSubjectDrop(subject);
                }}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-800 relative group"
                onClick={() => {
                  if (!editingSubject) {
                    navigate(`/subject/${encodeURIComponent(subject)}`);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
                    {editingSubject === subject ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleRenameSubject(subject, editingSubjectName);
                        }}
                        className="flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingSubjectName}
                          onChange={(e) => setEditingSubjectName(e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          autoFocus
                          onBlur={() => {
                            handleRenameSubject(subject, editingSubjectName);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setEditingSubject(null);
                              setEditingSubjectName('');
                            } else if (e.key === 'Enter') {
                              handleRenameSubject(subject, editingSubjectName);
                            }
                          }}
                        />
                      </form>
                    ) : (
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {subject}
                      </h3>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editingSubject === subject) {
                          handleRenameSubject(subject, editingSubjectName);
                        } else {
                          setEditingSubject(subject);
                          setEditingSubjectName(subject);
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded transition-colors"
                      title={t('dashboard.subjects.rename')}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSubjectToDelete(subject);
                        setShowDeleteSubjectModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 rounded transition-colors"
                      title={t('dashboard.subjects.delete.title')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {documents.filter((doc) => doc.subject.toLowerCase() === subject.toLowerCase()).length} documents
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents List */}
      <div>
        <div className="flex justify-end relative overflow-hidden">
          {/* Main Content */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.documents.title')}</h1>
            </div>

            {/* Main Content with padding */}
            <div>
              {/* PDF & Lecture Documents Section */}
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
                {selectedSubject === 'All Documents' ? t('dashboard.documents.sections.pdf') : selectedSubject}
              </h2>
              
              {isLoadingDocuments ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 overflow-hidden"
                    >
                      <div className="animate-pulse">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-1/4"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : documents.length > 0 ? (
                <>
                  {/* PDF & Lecture Documents */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                    {nonYoutubeDocuments.map((doc) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer h-[120px] border border-gray-200 dark:border-gray-800"
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest('.actions-menu')) {
                            navigate(`/document/${doc.id}`);
                          }
                        }}
                        draggable
                        onDragStart={() => handleDragStart(doc)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            {editingDocId === doc.id ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleTitleUpdate(doc.id);
                                }}
                                className="title-edit"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  ref={titleInputRef}
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onBlur={() => handleTitleUpdate(doc.id)}
                                  className="w-full px-2 py-1 text-lg font-semibold text-gray-900 dark:text-white border-b-2 border-indigo-500 focus:outline-none focus:border-indigo-600 bg-transparent"
                                  placeholder={t('dashboard.documents.empty.title')}
                                />
                              </form>
                            ) : (
                              <>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1">
                                  {doc.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(doc.createdAt).toLocaleDateString()}
                                </p>
                              </>
                            )}
                          </div>
                          <div 
                            className="relative actions-menu" 
                            ref={el => menuRefs.current[doc.id] = el}
                            onClick={e => e.stopPropagation()}
                            style={{ position: 'relative', zIndex: 9999 }}
                          >
                            <button
                              ref={el => menuRefs.current[doc.id] = el}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                const viewportWidth = window.innerWidth;
                                const menuWidth = 192; // w-48 = 12rem = 192px
                                
                                // Calculate left position, ensuring menu stays within viewport
                                let left = rect.left + window.scrollX;
                                if (left + menuWidth > viewportWidth) {
                                  left = viewportWidth - menuWidth - 16; // 16px padding from viewport edge
                                }
                                
                                setMenuPosition({
                                  left,
                                  top: rect.bottom + window.scrollY + 8
                                });
                                setOpenDocMenu(doc.id);
                              }}
                              className="actions-menu p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <MoreVertical className="h-5 w-5" />
                            </button>
                            
                            {openDocMenu === doc.id && createPortal(
                              <div 
                                ref={el => menuContentRefs.current[doc.id] = el}
                                className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-48" 
                                style={{ 
                                  zIndex: 99999,
                                  left: menuPosition?.left || 0,
                                  top: menuPosition?.top || 0,
                                }}
                                onClick={e => e.stopPropagation()}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setEditingDocId(doc.id);
                                      setEditingTitle(doc.title);
                                      setOpenDocMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    {t('dashboard.documents.actions.rename')}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setShowMoveToSubject(doc.id);
                                      setOpenDocMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <FolderOpen className="h-4 w-4" />
                                      {t('dashboard.documents.actions.moveToSubject')}
                                    </div>
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setDocumentToDelete({ id: doc.id, title: doc.title });
                                      setShowDeleteModal(true);
                                      setOpenDocMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    {t('dashboard.documents.actions.delete')}
                                  </button>
                                </div>
                              </div>,
                              document.body
                            )}
                            
                            {showMoveToSubject === doc.id && createPortal(
                              <div 
                                ref={el => menuContentRefs.current[`${doc.id}-subject`] = el}
                                className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-48" 
                                style={{ 
                                  zIndex: 99999,
                                  left: menuPosition?.left || 0,
                                  top: menuPosition?.top || 0,
                                }}
                                onClick={e => e.stopPropagation()}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleMoveToSubject(doc.id, '');
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm ${
                                      !doc.subject
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    } flex items-center gap-2`}
                                  >
                                    <LayoutDashboard className="h-4 w-4" />
                                    {t('dashboard.subjects.dashboard')}
                                  </button>
                                  {subjects.map((subject) => (
                                    <button
                                      key={subject}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleMoveToSubject(doc.id, subject);
                                      }}
                                      className={`w-full text-left px-4 py-2 text-sm ${
                                        doc.subject === subject
                                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                      } flex items-center gap-2`}
                                    >
                                      <FolderOpen className="h-4 w-4" />
                                      {subject}
                                    </button>
                                  ))}
                                </div>
                              </div>,
                              document.body
                            )}
                          </div>
                          {doc.type === 'pdf' ? (
                            <FileText className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          ) : (
                            <Mic className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* YouTube Videos Section */}
                  <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">{t('dashboard.documents.sections.youtube')}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ position: 'relative' }}>
                    {youtubeDocuments.map((doc) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white dark:bg-gray-900 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-800"
                        style={{ position: 'relative' }}
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest('.actions-menu')) {
                            navigate(`/document/${doc.id}`);
                          }
                        }}
                        draggable
                        onDragStart={() => handleDragStart(doc)}
                        onDragEnd={handleDragEnd}
                      >
                        {/* Thumbnail */}
                        <div className="w-full">
                          <div className="relative">
                            {(() => {
                              return doc.thumbnail_url ? (
                                <img 
                                  src={doc.thumbnail_url} 
                                  alt={doc.title}
                                  className="w-full h-48 rounded-t-lg"
                                  style={{ objectFit: 'cover' }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                  draggable={false}
                                />
                              ) : (
                                <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-t-lg flex items-center justify-center">
                                  <Youtube className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                </div>
                              );
                            })()}
                            <div className="absolute top-2 right-2">
                              <div className="bg-black/60 rounded-lg p-2">
                                <Youtube className="h-5 w-5 text-white" />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              {editingDocId === doc.id ? (
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleTitleUpdate(doc.id);
                                  }}
                                  className="title-edit"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    ref={titleInputRef}
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onBlur={() => handleTitleUpdate(doc.id)}
                                    className="w-full px-2 py-1 text-lg font-semibold text-gray-900 dark:text-white border-b-2 border-indigo-500 focus:outline-none focus:border-indigo-600 bg-transparent"
                                    placeholder={t('dashboard.documents.empty.title')}
                                  />
                                </form>
                              ) : (
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1">
                                  {doc.title}
                                </h3>
                              )}
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div 
                              className="relative actions-menu" 
                              ref={el => menuRefs.current[doc.id] = el}
                              onClick={e => e.stopPropagation()}
                              style={{ position: 'relative', zIndex: 9999 }}
                            >
                              <button
                                ref={el => menuRefs.current[doc.id] = el}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const viewportWidth = window.innerWidth;
                                  const menuWidth = 192; // w-48 = 12rem = 192px
                                  
                                  // Calculate left position, ensuring menu stays within viewport
                                  let left = rect.left + window.scrollX;
                                  if (left + menuWidth > viewportWidth) {
                                    left = viewportWidth - menuWidth - 16; // 16px padding from viewport edge
                                  }
                                  
                                  setMenuPosition({
                                    left,
                                    top: rect.bottom + window.scrollY + 8
                                  });
                                  setOpenDocMenu(doc.id);
                                }}
                                className="actions-menu p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              
                              {openDocMenu === doc.id && createPortal(
                                <div 
                                  ref={el => menuContentRefs.current[doc.id] = el}
                                  className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-48" 
                                  style={{ 
                                    zIndex: 99999,
                                    left: menuPosition?.left || 0,
                                    top: menuPosition?.top || 0,
                                  }}
                                  onClick={e => e.stopPropagation()}
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setEditingDocId(doc.id);
                                        setEditingTitle(doc.title);
                                        setOpenDocMenu(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <Pencil className="h-4 w-4" />
                                      {t('dashboard.documents.actions.rename')}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowMoveToSubject(doc.id);
                                        setOpenDocMenu(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 justify-between"
                                    >
                                      <div className="flex items-center gap-2">
                                        <FolderOpen className="h-4 w-4" />
                                        {t('dashboard.documents.actions.moveToSubject')}
                                      </div>
                                      <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDocumentToDelete({ id: doc.id, title: doc.title });
                                        setShowDeleteModal(true);
                                        setOpenDocMenu(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {t('dashboard.documents.actions.delete')}
                                    </button>
                                  </div>
                                </div>,
                                document.body
                              )}
                              
                              {showMoveToSubject === doc.id && createPortal(
                                <div 
                                  ref={el => menuContentRefs.current[`${doc.id}-subject`] = el}
                                  className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-48" 
                                  style={{ 
                                    zIndex: 99999,
                                    left: menuPosition?.left || 0,
                                    top: menuPosition?.top || 0,
                                  }}
                                  onClick={e => e.stopPropagation()}
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleMoveToSubject(doc.id, '');
                                      }}
                                      className={`w-full text-left px-4 py-2 text-sm ${
                                        !doc.subject
                                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                      } flex items-center gap-2`}
                                    >
                                      <LayoutDashboard className="h-4 w-4" />
                                      {t('dashboard.subjects.dashboard')}
                                    </button>
                                    {subjects.map((subject) => (
                                      <button
                                        key={subject}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleMoveToSubject(doc.id, subject);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm ${
                                          doc.subject === subject
                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        } flex items-center gap-2`}
                                      >
                                        <FolderOpen className="h-4 w-4" />
                                        {subject}
                                      </button>
                                    ))}
                                  </div>
                                </div>,
                                document.body
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="mt-12 text-center">
                  <p className="text-gray-500 dark:text-gray-400">{t('dashboard.documents.empty.title')}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('dashboard.documents.empty.description')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
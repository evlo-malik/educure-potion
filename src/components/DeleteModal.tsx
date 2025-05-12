import React from 'react';
import { Trash2, X, Loader2 } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  isDeleting?: boolean;
}

export default function DeleteModal({ isOpen, onClose, onConfirm, fileName, isDeleting = false }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fadeIn"
        onClick={!isDeleting ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:shadow-gray-900/50 w-full max-w-md mx-4 animate-modal-slide-up">
        {/* Delete Icon Animation */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center animate-bounce-small">
              {isDeleting ? (
                <Loader2 className="w-12 h-12 text-red-500 dark:text-red-400 animate-spin" />
              ) : (
                <Trash2 className="w-12 h-12 text-red-500 dark:text-red-400 animate-shake" />
              )}
            </div>
            <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-ripple" />
          </div>
        </div>

        {/* Close button */}
        {!isDeleting && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        )}

        {/* Content */}
        <div className="pt-16 px-6 pb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 text-center mb-2">
            {isDeleting ? 'Deleting Document...' : 'Delete Document?'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
            {isDeleting ? (
              'Please wait while we delete your document...'
            ) : (
              <>Are you sure you want to delete "<span className="text-gray-700 dark:text-gray-300 font-medium">{fileName}</span>"? This action cannot be undone.</>
            )}
          </p>

          {/* Buttons */}
          {!isDeleting && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-500 transition-colors animate-pulse-subtle"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Check, X, Trash2 } from 'lucide-react';

interface FlashcardProps {
  question: React.ReactNode;
  answer: React.ReactNode;
  slideDirection?: 'left' | 'right';
  onSwipe?: (direction: 'left' | 'right') => void;
  onEdit?: (newQuestion: string, newAnswer: string) => void;
  onDelete?: () => void;
  isEditable?: boolean;
  isEditing?: boolean;
  rawQuestion?: string;
  rawAnswer?: string;
  onCancelEdit?: () => void;
}

export default function Flashcard({ 
  question, 
  answer, 
  slideDirection, 
  onSwipe,
  onEdit,
  onDelete,
  isEditable = false,
  isEditing = false,
  rawQuestion = '',
  rawAnswer = '',
  onCancelEdit
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState(rawQuestion);
  const [editedAnswer, setEditedAnswer] = useState(rawAnswer);
  const { t } = useTranslation();

  useEffect(() => {
    setEditedQuestion(rawQuestion);
    setEditedAnswer(rawAnswer);
  }, [rawQuestion, rawAnswer]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !onSwipe) return;

    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;

    if (Math.abs(diff) > 50) {
      onSwipe(diff > 0 ? 'left' : 'right');
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(editedQuestion, editedAnswer);
    }
  };

  const handleCancelEdit = () => {
    setEditedQuestion(rawQuestion);
    setEditedAnswer(rawAnswer);
    onCancelEdit?.();
  };

  const handleCardClick = () => {
    if (!isEditing) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div
      className={`relative w-full aspect-[4/3] ${!isEditing && 'cursor-pointer'} ${
        slideDirection === 'left' ? 'animate-slideLeft' : 
        slideDirection === 'right' ? 'animate-slideRight' : ''
      }`}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ perspective: '1000px' }}
    >
      {isEditable && !isEditing && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditedQuestion(rawQuestion);
              setEditedAnswer(rawAnswer);
              onEdit?.(rawQuestion, rawAnswer);
            }}
            className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Pencil className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) {
                const dialog = document.createElement('div');
                dialog.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50';
                dialog.innerHTML = `
                  <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl max-w-sm w-full transform transition-all">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">${t('documentView.flashcards.deleteConfirm.title')}</h3>
                    <p class="text-gray-600 dark:text-gray-300 mb-6">${t('documentView.flashcards.deleteConfirm.message')}</p>
                    <div class="flex justify-end gap-3">
                      <button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" id="cancel-delete">
                        ${t('common.cancel')}
                      </button>
                      <button class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors" id="confirm-delete">
                        ${t('common.delete')}
                      </button>
                    </div>
                  </div>
                `;
                document.body.appendChild(dialog);

                const handleConfirm = () => {
                  onDelete();
                  document.body.removeChild(dialog);
                };

                const handleCancel = () => {
                  document.body.removeChild(dialog);
                };

                dialog.querySelector('#confirm-delete')?.addEventListener('click', handleConfirm);
                dialog.querySelector('#cancel-delete')?.addEventListener('click', handleCancel);
                dialog.addEventListener('click', (e) => {
                  if (e.target === dialog) {
                    handleCancel();
                  }
                });
              }
            }}
            className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
          >
            <Trash2 className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
          <div className="h-full flex flex-col gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('documentView.flashcards.labels.question')}
              </label>
              <textarea
                value={editedQuestion}
                onChange={(e) => setEditedQuestion(e.target.value)}
                className="w-full h-[40%] p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder={t('documentView.flashcards.placeholders.question')}
              />
              
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">
                {t('documentView.flashcards.labels.answer')}
              </label>
              <textarea
                value={editedAnswer}
                onChange={(e) => setEditedAnswer(e.target.value)}
                className="w-full h-[40%] p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder={t('documentView.flashcards.placeholders.answer')}
              />
            </div>
            
            <div className="flex justify-end items-center">
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="w-full h-full relative transition-transform duration-500 transform-style-preserve-3d"
          style={{ 
            transform: isFlipped ? 'rotateY(180deg)' : '',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Front side (Question) */}
          <div 
            className="absolute w-full h-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 dark:shadow-gray-900/50"
            style={{ 
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-xl font-medium text-gray-900 dark:text-white">
                {question}
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                {t('documentView.flashcards.clickToFlip')}
                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>

          {/* Back side (Answer) */}
          <div 
            className="absolute w-full h-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 dark:shadow-gray-900/50"
            style={{ 
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-xl font-medium text-gray-900 dark:text-white">
                {answer}
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                {t('documentView.flashcards.clickToFlip')}
                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { submitFeedback } from '../lib/feedback';

interface CancelFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  userId: string;
  userName: string;
}

export default function CancelFeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  userId,
  userName
}: CancelFeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      onSubmit();
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({
        userId,
        userName,
        email: '',
        message: `Cancellation Feedback: ${feedback}`,
        type: 'feedback'
      });
      onSubmit();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      onSubmit(); // Continue with cancellation even if feedback fails
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 z-50"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Please Share Your Feedback
        </h3>
        <p className="text-gray-600 mb-4">
          We'd love to know why you're leaving so we can improve our service.
        </p>

        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="What made you decide to cancel?"
          className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-4"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={() => onSubmit()} // Skip feedback
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit
          </button>
        </div>
      </motion.div>
    </div>
  );
}
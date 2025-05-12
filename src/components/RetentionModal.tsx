import React from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Brain, Zap } from 'lucide-react';

interface RetentionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
}

export default function RetentionModal({
  isOpen,
  onClose,
  onConfirmCancel
}: RetentionModalProps) {
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

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Don't Miss Out on What's Coming!
          </h3>
          <p className="text-gray-600">
            We're introducing exciting new features exclusively for our premium members:
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Advanced AI Study Paths</h4>
              <p className="text-sm text-gray-600">Personalized learning journeys based on your study patterns</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Enhanced Study Tools</h4>
              <p className="text-sm text-gray-600">Revolutionary features to boost your exam performance</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
          >
            Keep My Subscription
          </button>
          <button
            onClick={onConfirmCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Continue Cancellation
          </button>
        </div>
      </motion.div>
    </div>
  );
}
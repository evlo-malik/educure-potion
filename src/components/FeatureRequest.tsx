import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Send, Loader2, AlertCircle } from 'lucide-react';
import { submitFeedback } from '../lib/feedback';
import { useNavigate } from 'react-router-dom';

export default function FeatureRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    useCase: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');

    if (!userId) {
      setError('Please log in to submit a feature request');
      setIsSubmitting(false);
      return;
    }

    try {
      const message = `
Title: ${formData.title}
Description: ${formData.description}
Use Case: ${formData.useCase}
`;

      const result = await submitFeedback({
        userId,
        userName: userName || 'Anonymous',
        email: '',
        message,
        type: 'feature_request',
        priority: formData.priority
      });

      if (result.success) {
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 left-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-800 dark:text-green-200 px-6 py-4 rounded-lg shadow-lg z-50 animate-slideUp';
        toast.innerHTML = `
          <div class="flex items-center gap-3">
            <svg class="h-5 w-5 text-green-500 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p class="font-medium">Thank you for your feature request!</p>
          </div>
        `;
        document.body.appendChild(toast);

        // Remove toast and redirect after delay
        setTimeout(() => {
          toast.remove();
          navigate('/dashboard');
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to submit feature request');
      }
    } catch (err) {
      console.error('Error submitting feature request:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit feature request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl dark:shadow-gray-900/50 p-6 md:p-8 border border-white/20 dark:border-gray-800">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 p-3 mx-auto mb-4"
            >
              <Lightbulb className="w-full h-full text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
              Request a Feature
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Help us make EduCure AI better by suggesting new features
            </p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Feature Title
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                placeholder="Give your feature a clear, concise title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Description
              </label>
              <textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors resize-none"
                placeholder="Describe the feature in detail. What should it do?"
              />
            </div>

            <div>
              <label htmlFor="useCase" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Use Case
              </label>
              <textarea
                id="useCase"
                required
                value={formData.useCase}
                onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors resize-none"
                placeholder="How would this feature help you? What problem does it solve?"
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Priority Level
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
              >
                <option value="low">Low - Nice to have</option>
                <option value="medium">Medium - Would improve experience</option>
                <option value="high">High - Critical functionality</option>
              </select>
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-orange-500 dark:hover:from-amber-400 dark:hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Feature Request
                </>
              )}
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
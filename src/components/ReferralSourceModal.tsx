import { useState } from 'react';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';

interface ReferralSourceModalProps {
  userId: string;
  onClose: () => void;
}

const REFERRAL_SOURCES = [
  'TikTok',
  'Instagram',
  'RedNote',
  'X',
  'Word of mouth',
  'Other'
];

export function ReferralSourceModal({ userId, onClose }: ReferralSourceModalProps) {
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [otherSource, setOtherSource] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedSource) return;
    
    setIsSubmitting(true);
    try {
      const source = selectedSource === 'Other' ? otherSource : selectedSource;
      
      await addDoc(collection(db, 'referral_sources'), {
        userId,
        source,
        createdAt: serverTimestamp(),
        otherDetails: selectedSource === 'Other' ? otherSource : null
      });

      await setDoc(doc(db, 'users', userId), {
        hasSeenReferralModal: true
      }, { merge: true });
      
      onClose();
    } catch (error) {
      console.error('Error saving referral source:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
      >
        {/* Glowing effect */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-2xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-3xl animate-pulse" />
        </div>

        <div className="relative">
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            How did you hear about us?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Help us understand how you found our platform
          </p>
          
          <div className="space-y-3">
            {REFERRAL_SOURCES.map((source) => (
              <motion.button
                key={source}
                onClick={() => setSelectedSource(source)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 font-medium
                  ${selectedSource === source
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-gray-700 dark:text-gray-300'
                  }`}
              >
                {source}
              </motion.button>
            ))}
          </div>

          {selectedSource === 'Other' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <input
                type="text"
                value={otherSource}
                onChange={(e) => setOtherSource(e.target.value)}
                placeholder="Please specify"
                className="mt-4 w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl 
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none
                         transition-all duration-200"
              />
            </motion.div>
          )}

          <div className="mt-8 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!selectedSource || (selectedSource === 'Other' && !otherSource) || isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl
                       font-medium hover:from-indigo-600 hover:to-purple-700 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40
                       transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </div>
              ) : (
                'Submit'
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 
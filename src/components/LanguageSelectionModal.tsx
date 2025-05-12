import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

// Language options with flag codes (same as in Profile.tsx)
const languages = [
  { code: 'en', name: 'English', flag: 'gb' },
  { code: 'es', name: 'Spanish', flag: 'es' },
  { code: 'fr', name: 'French', flag: 'fr' },
  { code: 'de', name: 'German', flag: 'de' },
  { code: 'it', name: 'Italian', flag: 'it' },
  { code: 'pt', name: 'Portuguese', flag: 'pt' },
  { code: 'ru', name: 'Russian', flag: 'ru' },
  { code: 'zh', name: 'Chinese', flag: 'cn' },
  { code: 'ar', name: 'Arabic', flag: 'sa' },
  { code: 'bg', name: 'Bulgarian', flag: 'bg' },
  { code: 'hi', name: 'Hindi', flag: 'in' },
  { code: 'lt', name: 'Lithuanian', flag: 'lt' },
  { code: 'fil', name: 'Filipino', flag: 'ph' },
  { code: 'nl', name: 'Dutch', flag: 'nl' },
  { code: 'pl', name: 'Polish', flag: 'pl' },
  { code: 'tr', name: 'Turkish', flag: 'tr' },
  { code: 'uk', name: 'Ukrainian', flag: 'ua' },
  { code: 'da', name: 'Danish', flag: 'dk' },
  { code: 'sv', name: 'Swedish', flag: 'se' },
  { code: 'ms', name: 'Malay', flag: 'my' },
  { code: 'id', name: 'Indonesian', flag: 'id' },
  { code: 'ur', name: 'Urdu', flag: 'pk' },
  { code: 'ro', name: 'Romanian', flag: 'ro' },
  { code: 'el', name: 'Greek', flag: 'gr' },
  { code: 'vi', name: 'Vietnamese', flag: 'vn' },
  { code: 'lv', name: 'Latvian', flag: 'lv' },
  { code: 'no', name: 'Norwegian', flag: 'no' }
];

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageSelectionModal({ isOpen, onClose }: LanguageSelectionModalProps) {
  const { t } = useTranslation();
  const { setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const modalRef = useRef<HTMLDivElement>(null);

  const handleLanguageSelect = async (code: string) => {
    try {
      await setLanguage(code);
      localStorage.setItem('hasSelectedLanguage', 'true');
      onClose();
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Don't close on outside click as we want the user to make a selection
        // onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        ref={modalRef}
        className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('languageModal.title', 'Select Your Language')}
        </h2>
        <p className="text-gray-600 mb-6">
          {t('languageModal.description', 'Choose your preferred language for the best experience')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                selectedLanguage === language.code
                  ? 'bg-indigo-50 border-2 border-indigo-500'
                  : 'border-2 border-gray-100 hover:border-indigo-200'
              }`}
            >
              <img
                src={`https://flagcdn.com/24x18/${language.flag}.png`}
                srcSet={`https://flagcdn.com/48x36/${language.flag}.png 2x`}
                alt=""
                className="w-6 rounded-sm object-cover"
              />
              <span className={`flex-1 text-left ${
                selectedLanguage === language.code ? 'font-medium text-indigo-600' : 'text-gray-900'
              }`}>
                {language.name}
              </span>
              {selectedLanguage === language.code && (
                <Check className="w-5 h-5 text-indigo-600" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => handleLanguageSelect(selectedLanguage)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {t('languageModal.confirm', 'Confirm Selection')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
} 
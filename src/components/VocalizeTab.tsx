import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Loader2, ChevronDown, ChevronUp, Check, AlertCircle, ArrowRight, Globe } from 'lucide-react';
import { generateSpeech } from '../lib/elevenlabs';
import { deleteAudio, renameAudio, fetchDocumentAudios, MAX_AUDIOS_PER_DOCUMENT } from '../lib/storage';
import LoadingAudio from './LoadingAudio';
import AudioCard from './AudioCard';
import type { AudioEntry, ExtendedAudioStyle } from '../lib/firestore';
import { generateStyledText } from '../lib/gemini';
import { checkVocalizeLimit, getVocalizeUsage, incrementVocalizeUsage, VOCALIZE_LIMITS } from '../lib/vocalizeUsage';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import { updateDocument } from '../lib/firestore';
import { useTranslation } from 'react-i18next';
import * as flags from 'country-flag-icons/react/3x2';

interface VocalizeTabProps {
  document: {
    id: string;
    content: string;
    audioUrl?: string;
    audioStyle?: ExtendedAudioStyle;
    additionalAudios?: AudioEntry[];
  };
  onUpdate: () => void;
}

// Language codes mapping for flags
const LANGUAGE_FLAG_CODES: { [key: string]: string } = {
  'Afrikaans': 'za',
  'Albanian': 'al',
  'Arabic': 'sa',
  'Armenian': 'am',
  'Azerbaijani': 'az',
  'Bahasa Indonesian': 'id',
  'Bengali': 'bd',
  'Bosnian': 'ba',
  'Bulgarian': 'bg',
  'Catalan': 'es',
  'Chinese Cantonese': 'hk',
  'Chinese Mandarin': 'cn',
  'Croatian': 'hr',
  'Czech': 'cz',
  'Danish': 'dk',
  'Dutch': 'nl',
  'English': 'gb',
  'Estonian': 'ee',
  'Filipino': 'ph',
  'Finnish': 'fi',
  'French': 'fr',
  'Galician': 'es',
  'Georgian': 'ge',
  'German': 'de',
  'Greek': 'gr',
  'Hebrew': 'il',
  'Hindi': 'in',
  'Hungarian': 'hu',
  'Icelandic': 'is',
  'Irish': 'ie',
  'Italian': 'it',
  'Japanese': 'jp',
  'Javanese': 'id',
  'Kannada': 'in',
  'Kazakh': 'kz',
  'Korean': 'kr',
  'Latvian': 'lv',
  'Lithuanian': 'lt',
  'Macedonian': 'mk',
  'Malay': 'my',
  'Maltese': 'mt',
  'Marathi': 'in',
  'Mongolian': 'mn',
  'Nepali': 'np',
  'Norwegian Bokmål': 'no',
  'Pashto': 'af',
  'Persian': 'ir',
  'Polish': 'pl',
  'Portuguese': 'pt',
  'Romanian': 'ro',
  'Russian': 'ru',
  'Serbian': 'rs',
  'Sinhala': 'lk',
  'Slovak': 'sk',
  'Slovene': 'si',
  'Somali': 'so',
  'Spanish': 'es',
  'Swahili': 'tz',
  'Swedish': 'se',
  'Tamil': 'in',
  'Telugu': 'in',
  'Thai': 'th',
  'Turkish': 'tr',
  'Ukrainian': 'ua',
  'Urdu': 'pk',
  'Uzbek': 'uz',
  'Vietnamese': 'vn',
  'Welsh': 'gb',
  'Zulu': 'za'
};

const createStyleOptions = (t: (key: string) => string) => [
  { 
    value: 'Lecture' as ExtendedAudioStyle, 
    label: t('documentView.vocalize.styleOptions.lecture.label'),
    description: t('documentView.vocalize.styleOptions.lecture.description'),
    icon: '🎓',
    languageAvailability: t('documentView.vocalize.languageAvailability.english')
  },
  { 
    value: 'News' as ExtendedAudioStyle, 
    label: t('documentView.vocalize.styleOptions.news.label'),
    description: t('documentView.vocalize.styleOptions.news.description'),
    icon: '📰',
    languageAvailability: t('documentView.vocalize.languageAvailability.english')
  },
  { 
    value: 'Soft' as ExtendedAudioStyle, 
    label: t('documentView.vocalize.styleOptions.soft.label'),
    description: t('documentView.vocalize.styleOptions.soft.description'),
    icon: '🌸',
    languageAvailability: t('documentView.vocalize.languageAvailability.english')
  },
  { 
    value: 'ASMR' as ExtendedAudioStyle, 
    label: t('documentView.vocalize.styleOptions.asmr.label'),
    description: t('documentView.vocalize.styleOptions.asmr.description'),
    isPro: true,
    proLabel: t('documentView.vocalize.styleOptions.asmr.pro'),
    icon: '🎧',
    languageAvailability: t('documentView.vocalize.languageAvailability.languages29')
  },
  { 
    value: 'Motivational' as ExtendedAudioStyle, 
    label: t('documentView.vocalize.styleOptions.motivational.label'),
    description: t('documentView.vocalize.styleOptions.motivational.description'),
    isPro: true,
    proLabel: t('documentView.vocalize.styleOptions.motivational.pro'),
    icon: '🔥',
    languageAvailability: t('documentView.vocalize.languageAvailability.languages60')
  },
  { 
    value: 'Storytelling' as ExtendedAudioStyle, 
    label: t('documentView.vocalize.styleOptions.storytelling.label'),
    description: t('documentView.vocalize.styleOptions.storytelling.description'),
    isPro: true,
    proLabel: t('documentView.vocalize.styleOptions.storytelling.pro'),
    icon: '📚',
    languageAvailability: t('documentView.vocalize.languageAvailability.languages60')
  }
];

const VOCALIZE_LANGUAGES = [
  'Afrikaans', 'Albanian', 'Arabic', 'Armenian', 'Azerbaijani', 'Bahasa Indonesian',
  'Bengali', 'Bosnian', 'Bulgarian', 'Catalan', 'Chinese Cantonese',
  'Chinese Mandarin', 'Croatian', 'Czech', 'Danish', 'Dutch',
  'English', 'Estonian', 'Filipino', 'Finnish', 'French', 'Galician', 'Georgian',
  'German', 'Greek', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic', 'Irish', 'Italian',
  'Japanese', 'Javanese', 'Kannada', 'Kazakh', 'Korean', 'Latvian', 'Lithuanian',
  'Macedonian', 'Malay', 'Maltese', 'Marathi', 'Mongolian', 'Nepali',
  'Norwegian Bokmål', 'Pashto', 'Persian', 'Polish', 'Portuguese', 'Romanian',
  'Russian', 'Serbian', 'Sinhala', 'Slovak', 'Slovene', 'Somali', 'Spanish',
  'Swahili', 'Swedish', 'Tamil', 'Telugu', 'Thai', 'Turkish', 'Ukrainian', 'Urdu',
  'Uzbek', 'Vietnamese', 'Welsh', 'Zulu'
];

const ASMR_LANGUAGES = [
  'Arabic',
  'Bulgarian',
  'Chinese Mandarin',
  'Croatian',
  'Czech',
  'Danish',
  'Dutch',
  'English',
  'Filipino',
  'Finnish',
  'French',
  'German',
  'Greek',
  'Hindi',
  'Bahasa Indonesian',
  'Italian',
  'Japanese',
  'Korean',
  'Malay',
  'Polish',
  'Portuguese',
  'Romanian',
  'Russian',
  'Slovak',
  'Spanish',
  'Swedish',
  'Tamil',
  'Turkish',
  'Ukrainian'
];

export default function VocalizeTab({ document, onUpdate }: VocalizeTabProps) {
  const { t } = useTranslation();
  const [selectedStyle, setSelectedStyle] = useState<ExtendedAudioStyle>('Lecture');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [languageSearch, setLanguageSearch] = useState('');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [savedAudios, setSavedAudios] = useState<AudioEntry[]>([]);
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const userId = localStorage.getItem('userId');
  const { plan } = useSubscription();
  const [vocalizeUsage, setVocalizeUsage] = useState({ standard: 0, pro: 0 });
  const limits = VOCALIZE_LIMITS[plan];

  const styleOptions = createStyleOptions(t);
  const selectedOption = styleOptions.find(option => option.value === selectedStyle);

  const isProStyle = selectedOption?.isPro;

  // Get available languages based on selected style
  const availableLanguages = selectedStyle === 'ASMR' ? ASMR_LANGUAGES : VOCALIZE_LANGUAGES;

  // Filter languages based on search and selected style
  const filteredLanguages = availableLanguages.filter(language =>
    language.toLowerCase().includes(languageSearch.toLowerCase())
  );

  // Update selectedLanguage when style changes to ensure it's valid for the new style
  useEffect(() => {
    if (selectedStyle === 'ASMR' && !ASMR_LANGUAGES.includes(selectedLanguage)) {
      setSelectedLanguage('English'); // Default to English if current language isn't available in ASMR
    } else if (selectedStyle !== 'ASMR' && !VOCALIZE_LANGUAGES.includes(selectedLanguage)) {
      setSelectedLanguage('English'); // Default to English if current language isn't available in regular list
    }
  }, [selectedStyle, selectedLanguage]);

  useEffect(() => {
    const loadUsage = async () => {
      if (userId) {
        const usage = await getVocalizeUsage(userId);
        setVocalizeUsage(usage);
      }
    };
    loadUsage();
  }, [userId]);

  useEffect(() => {
    const loadSavedAudios = async () => {
      if (userId && document.id) {
        const audios = await fetchDocumentAudios(userId, document.id);
        setSavedAudios(audios);
      }
    };
    loadSavedAudios();
  }, [userId, document.id]);

  /**
   * Handles the generation of audio from text.
   * The try-catch structure ensures that vocalize usage is only incremented
   * after successful generation. If any error occurs during the process,
   * the catch block will prevent usage from being incremented.
   */
  const handleGenerate = async () => {
    if (!document?.content || isGeneratingAudio || !userId) {
      if (!userId) {
        alert('Please log in to generate audio');
      }
      return;
    }

    try {
      // Check vocalize limits first
      const limitCheck = await checkVocalizeLimit(userId, selectedStyle, plan);
      if (!limitCheck.allowed) {
        setError(limitCheck.error || 'Generation limit reached');
        return;
      }

      setIsGeneratingAudio(true);
      setError(null);

      // Generate styled text using Gemini first
      const styledText = await generateStyledText(document.content, selectedStyle, selectedLanguage);
      
      // Log the styled text for debugging
      console.log('Generated styled text:', {
        style: selectedStyle,
        language: selectedLanguage,
        text: styledText
      });

      // Convert the styled text to speech using Eleven Labs
      const newAudioUrl = await generateSpeech(styledText, selectedStyle, document.id, userId, selectedLanguage);

      // Create new audio entry
      const newAudio: AudioEntry = {
        url: newAudioUrl,
        style: selectedStyle,
        name: `${selectedStyle} Version (${selectedLanguage})`,
        fileName: `${selectedStyle.toLowerCase()}_${Date.now()}.mp3`
      };

      // Update saved audios
      const updatedAudios = [...savedAudios, newAudio];
      setSavedAudios(updatedAudios);

      // Update document with new audio
      await updateDocument(document.id, {
        audioUrl: newAudioUrl,
        audioStyle: selectedStyle,
        additionalAudios: updatedAudios.slice(1)
      });

      // IMPORTANT: Increment usage count only after successful generation
      // This ensures users are not charged for failed generations
      await incrementVocalizeUsage(userId, limitCheck.type);

      // Update usage counts
      const updatedUsage = await getVocalizeUsage(userId);
      setVocalizeUsage(updatedUsage);

      setIsGeneratingAudio(false);

      // Auto-play the new audio
      setCurrentPlayingUrl(newAudioUrl);
      if (audioRef.current) {
        try {
          await audioRef.current.play();
          setIsAudioPlaying(true);
        } catch (playError) {
          console.warn('Auto-play failed:', playError);
        }
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate audio');
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-2xl">
        {/* Usage Indicators */}
        <div className="mb-8 space-y-4">
          {/* Standard Vocalize Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('documentView.vocalize.usage.standard')}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {vocalizeUsage.standard} / {limits.standardVocalize}
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
                style={{
                  width: `${(vocalizeUsage.standard / limits.standardVocalize) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Pro Vocalize Usage */}
          {plan !== 'cooked' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('documentView.vocalize.usage.pro')}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {vocalizeUsage.pro} / {limits.proVocalize}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 dark:bg-purple-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${(vocalizeUsage.pro / limits.proVocalize) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              {error.includes('limit') && (
                <Link
                  to="/pricing"
                  className="mt-2 inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                >
                  {t('documentView.vocalize.errors.upgradeRequired')}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Style Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('documentView.vocalize.voiceStyle')}</label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-left flex items-center justify-between group hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedOption?.icon}</span>
                <div>
                  <span className="block font-medium text-gray-900 dark:text-gray-100">{selectedOption?.label}</span>
                  <span className="block text-sm text-gray-500 dark:text-gray-400">{selectedOption?.description}</span>
                </div>
              </div>
              {isDropdownOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
              )}
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-black/20 overflow-hidden"
                >
                  {styleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedStyle(option.value as ExtendedAudioStyle);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedStyle === option.value ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{option.label}</span>
                          {option.isPro && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full">
                              {option.proLabel}
                            </span>
                          )}
                        </div>
                        <span className="block text-sm text-gray-500 dark:text-gray-400">{option.description}</span>
                        {option.languageAvailability && (
                          <span className="block text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                            {option.languageAvailability}
                          </span>
                        )}
                      </div>
                      {selectedStyle === option.value && (
                        <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Language Selection - Only shown for PRO styles */}
        {isProStyle && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                {t('documentView.vocalize.voiceLanguage')}
              </div>
            </label>
            <div className="relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-left flex items-center justify-between group hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const flagKey = LANGUAGE_FLAG_CODES[selectedLanguage].toUpperCase() as keyof typeof flags;
                    const FlagComponent = flags[flagKey];
                    return FlagComponent && <FlagComponent className="w-5 h-4" />;
                  })()}
                  <span className="block truncate text-gray-900 dark:text-gray-100">{t(`documentView.vocalize.languages.${selectedLanguage}`)}</span>
                </div>
                {isLanguageDropdownOpen ? (
                  <ChevronUp className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                )}
              </button>

              <AnimatePresence>
                {isLanguageDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-black/20"
                  >
                    <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                      <input
                        type="text"
                        value={languageSearch}
                        onChange={(e) => setLanguageSearch(e.target.value)}
                        placeholder={t('documentView.vocalize.searchLanguage')}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredLanguages.map((language) => {
                        const flagKey = LANGUAGE_FLAG_CODES[language].toUpperCase() as keyof typeof flags;
                        const FlagComponent = flags[flagKey];
                        return (
                          <button
                            key={language}
                            onClick={() => {
                              setSelectedLanguage(language);
                              setIsLanguageDropdownOpen(false);
                              setLanguageSearch('');
                            }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                              selectedLanguage === language ? 'bg-indigo-50 dark:bg-indigo-900/30' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {FlagComponent && <FlagComponent className="w-5 h-4" />}
                              <span className={`block truncate ${
                                selectedLanguage === language ? 'font-medium text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {t(`documentView.vocalize.languages.${language}`)}
                              </span>
                            </div>
                            {selectedLanguage === language && (
                              <Check className="absolute right-4 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </button>
                        );
                      })}
                      {filteredLanguages.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                          {t('documentView.vocalize.noLanguagesFound')}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Generate New Audio Button */}
        {savedAudios.length >= MAX_AUDIOS_PER_DOCUMENT ? (
          <div className="text-center mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">{t('documentView.vocalize.errors.maxAudioLimit')}</p>
            <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
              {t('documentView.vocalize.errors.deleteExisting')}
            </p>
          </div>
        ) : isGeneratingAudio ? (
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 mb-6">
              <LoadingAudio className="w-full h-full text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{t('documentView.vocalize.errors.generatingAudio')}</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t('documentView.vocalize.errors.creatingStyle')} {selectedStyle.toLowerCase()}
            </p>
          </div>
        ) : (
          <div className="text-center mb-8">
            <button
              onClick={handleGenerate}
              disabled={savedAudios.length >= MAX_AUDIOS_PER_DOCUMENT}
              className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-semibold hover:from-violet-500 hover:to-purple-500 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg dark:shadow-purple-900/30"
            >
              <span className="flex items-center justify-center gap-2">
                <Volume2 className="h-5 w-5" />
                {t('documentView.vocalize.buttons.generateNew')} {selectedStyle}
              </span>
            </button>
          </div>
        )}

        {/* Saved Audios Section */}
        {savedAudios.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('documentView.vocalize.buttons.savedVersions')} ({savedAudios.length}/{MAX_AUDIOS_PER_DOCUMENT})
            </h3>
            <div className="grid gap-4">
              {savedAudios.map((audio, index) => (
                <AudioCard
                  key={`${audio.url}-${index}`}
                  audio={audio}
                  isPlaying={currentPlayingUrl === audio.url}
                  onPlay={() => setCurrentPlayingUrl(audio.url)}
                  onPause={() => setCurrentPlayingUrl(null)}
                  onEnd={() => setCurrentPlayingUrl(null)}
                  onDelete={async () => {
                    if (audio.fileName && userId) {
                      const success = await deleteAudio(userId, document.id, audio.fileName);
                      if (success) {
                        const updatedAudios = await fetchDocumentAudios(userId, document.id);
                        setSavedAudios(updatedAudios);
                      }
                    }
                  }}
                  onRename={async (newName) => {
                    if (audio.fileName && userId) {
                      const success = await renameAudio(userId, document.id, audio.fileName, newName);
                      if (success) {
                        const updatedAudios = await fetchDocumentAudios(userId, document.id);
                        setSavedAudios(updatedAudios);
                      }
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {savedAudios.length === 0 && !isGeneratingAudio && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p>{t('documentView.vocalize.errors.noAudioYet')}</p>
            <p className="text-sm mt-2">{t('documentView.vocalize.errors.generateFirst')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
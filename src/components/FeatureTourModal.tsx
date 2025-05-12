import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  FileUp,
  Youtube,
  MessageSquare,
  Highlighter,
  MousePointerSquare,
  BookOpen,
  PenLine,
  Brain,
  HelpCircle,
  Volume2,
  Clock,
  Calendar,
  Zap,
  MousePointer2,
  FileSearch,
  Mic,
  RefreshCw,
  CreditCard,
  Sparkles
} from 'lucide-react';

interface FeatureTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const slides = [
  {
    title: 'Welcome to EduCure AI',
    description: 'Let us show you how to make the most of our powerful learning tools. This tour will guide you through all the features and help you understand how to use them effectively.',
    Icon: Brain,
    gradient: 'from-indigo-500 to-purple-500',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop',
  },
  {
    title: 'Upload Your Study Materials',
    description: 'Multiple ways to add your study content:',
    Icon: FileUp,
    gradient: 'from-blue-500 to-cyan-500',
    features: [
      'Upload PDF documents up to 40MB',
      'Paste YouTube video URLs for automatic transcription',
      'Record live lectures with real-time transcription',
      'Automatic content extraction and processing',
      'Support for academic papers, textbooks, and lecture materials'
    ]
  },
  {
    title: 'Smart Selection Tools',
    description: 'Two powerful ways to interact with your documents:',
    Icon: MousePointer2,
    gradient: 'from-violet-500 to-fuchsia-500',
    features: [
      'Text Selection Mode: Highlight and analyze specific text passages',
      'Area Selection Mode: Capture diagrams, equations, or tables',
      'Get instant AI analysis of selected content',
      'Switch between modes using toolbar buttons',
      'Perfect for complex documents with mixed content types'
    ]
  },
  {
    title: 'Area Selection Guide',
    description: 'How to use the Area Selection tool effectively:',
    Icon: MousePointerSquare,
    gradient: 'from-pink-500 to-rose-500',
    features: [
      'Click the "Mouse Pointing at Square" icon in the toolbar (over the pdf file) to activate',
      'Great for mathematical equations, diagrams, and figures',
      'Click and drag to create a selection rectangle',
      'AI tutor will analyze the visual content and give you a response considering the context of the document',
      'Click "chat" and ask any question about the selected content',
      'Weekly limit resets every Sunday at midnight'
    ]
  },
  {
    title: 'AI-Powered Chat',
    description: 'Have natural conversations about your documents:',
    Icon: MessageSquare,
    gradient: 'from-emerald-500 to-teal-500',
    features: [
      'Ask questions about specific parts or the whole document',
      'Get detailed explanations and clarifications',
      'Reference timestamps in video content',
      'Natural, context-aware responses',
      'Daily message limits reset at midnight',
      'Additional messages can be purchased if needed'
    ]
  },
  {
    title: 'Study Material Generation',
    description: 'Transform your documents into various study formats:',
    Icon: Sparkles,
    gradient: 'from-amber-500 to-orange-500',
    features: [
      'Comprehensive summaries of key points',
      'Structured study notes with headings and highlights',
      'Interactive flashcards for effective memorization',
      'Practice tests with detailed explanations',
      'Multiple choice and true/false questions',
      'Audio versions in different speaking styles'
    ]
  },
  {
    title: 'Vocalize Feature',
    description: 'Convert your study materials into audio:',
    Icon: Volume2,
    gradient: 'from-purple-500 to-indigo-500',
    features: [
      'Multiple voice styles: Lecture, News, Soft, ASMR, Motivational, Storytelling',
      'Pro styles (ASMR, Motivational, Storytelling) for higher-tier plans',
      'Save multiple versions of the same content',
      'Monthly generation limits reset on the 1st',
      'Download audio for offline listening',
      'Customize names for saved audio versions'
    ]
  },
  {
    title: 'Live Lecture Recording',
    description: 'Record and transcribe lectures in real-time:',
    Icon: Mic,
    gradient: 'from-red-500 to-pink-500',
    features: [
      'Record lectures directly from your device',
      'Real-time speech-to-text transcription',
      'Pause and resume recording as needed',
      'Edit transcripts after recording',
      'Generate study materials from recordings',
      'Monthly recording limits reset on the 1st'
    ]
  },
  {
    title: 'Usage Limits & Resets',
    description: 'Understanding your plan limits:',
    Icon: RefreshCw,
    gradient: 'from-green-500 to-teal-500',
    features: [
      'Text Messages: Reset daily at midnight',
      'Area Selection Messages: Reset weekly on Sunday',
      'Document Uploads: Reset weekly on Sunday',
      'Lecture Recordings: Reset monthly on the 1st',
      'Vocalize Generations: Reset monthly on the 1st',
      'Upgrade plan or purchase additional messages as needed'
    ]
  },
  {
    title: 'Premium Features',
    description: 'Unlock more with paid plans:',
    Icon: CreditCard,
    gradient: 'from-violet-500 to-purple-500',
    features: [
      'Higher usage limits across all features',
      'Access to Pro voice styles in Vocalize',
      'Larger file size uploads (up to 40MB)',
      'More lecture recordings per month',
      'Unlimited text messages (Locked In plan)',
      'Priority support and feature access'
    ]
  }
];

export default function FeatureTourModal({ isOpen, onClose }: FeatureTourModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? prev : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? prev : prev - 1));
  };

  if (!isOpen) return null;

  const CurrentIcon = slides[currentSlide].Icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-gray-900/50 overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 z-10 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-gray-800">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              <div className="flex flex-col items-center text-center mb-8">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${slides[currentSlide].gradient} p-3 mb-6 transform transition-transform hover:scale-110`}>
                  <CurrentIcon className="w-full h-full text-white" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {slides[currentSlide].title}
                </h2>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 max-w-lg">
                  {slides[currentSlide].description}
                </p>
              </div>

              {/* Features list or image */}
              {'features' in slides[currentSlide] ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  {slides[currentSlide].features?.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                    >
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${slides[currentSlide].gradient} p-1.5 flex-shrink-0`}>
                        <CheckIcon className="w-full h-full text-white" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              ) : slides[currentSlide].image ? (
                <div className="mt-8 rounded-lg overflow-hidden shadow-lg dark:shadow-gray-900/50">
                  <img
                    src={slides[currentSlide].image}
                    alt="Feature illustration"
                    className="w-full h-64 object-cover"
                  />
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {Array.from({ length: slides.length }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? 'bg-indigo-600 dark:bg-indigo-400 w-4'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {currentSlide === slides.length - 1 ? (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-lg font-medium hover:from-indigo-500 hover:to-purple-500 dark:hover:from-indigo-400 dark:hover:to-purple-400 transition-all duration-200 transform hover:scale-105"
              >
                Get Started
              </button>
            ) : (
              <button
                onClick={nextSlide}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { 
  LifeBuoy, 
  Mail, 
  MessageSquare,
  FileText,
  Youtube,
  Brain,
  Clock,
  ArrowRight,
  Shield,
  FileQuestion,
  Lightbulb,
  Keyboard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Support() {
  const { t } = useTranslation();

  const commonQuestions = [
    {
      question: t('support.faq.questions.upload.question'),
      answer: t('support.faq.questions.upload.answer'),
      icon: FileText
    },
    {
      question: t('support.faq.questions.formats.question'),
      answer: t('support.faq.questions.formats.answer'),
      icon: Youtube
    },
    {
      question: t('support.faq.questions.aiAnalysis.question'),
      answer: t('support.faq.questions.aiAnalysis.answer'),
      icon: Brain
    },
    {
      question: t('support.faq.questions.chat.question'),
      answer: t('support.faq.questions.chat.answer'),
      icon: MessageSquare
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 p-4 mx-auto mb-6"
          >
            <LifeBuoy className="w-full h-full text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-4"
          >
            {t('support.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-300"
          >
            {t('support.subtitle')}
          </motion.p>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Email Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 rounded-2xl transition-opacity duration-300" />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600 p-2.5 mb-4">
                <Mail className="w-full h-full text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('support.emailSupport.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('support.emailSupport.description')}</p>
              <a
                href="mailto:admin@educure.io"
                className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                {t('support.emailSupport.button')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </motion.div>

          {/* Feature Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 rounded-2xl transition-opacity duration-300" />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 p-2.5 mb-4">
                <Lightbulb className="w-full h-full text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('support.featureRequests.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('support.featureRequests.description')}</p>
              <Link
                to="/feature-request"
                className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                {t('support.featureRequests.button')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 rounded-2xl transition-opacity duration-300" />
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-6 border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 p-2.5 mb-4">
                <MessageSquare className="w-full h-full text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('support.feedback.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('support.feedback.description')}</p>
              <Link
                to="/feedback"
                className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors"
              >
                {t('support.feedback.button')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Common Questions */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-gray-900/50 p-8 border border-gray-100 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">{t('support.faq.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {commonQuestions.map((item, index) => (
              <motion.div
                key={item.question}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{item.question}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{item.answer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
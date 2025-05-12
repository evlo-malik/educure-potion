import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Globe2, Youtube, Mic2, FolderKanban, Edit3, Download } from 'lucide-react';

interface Update {
  date: string;
  version: string;
  changes: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

const updates: Update[] = [
  {
    date: 'February 20, 2025',
    version: 'v2.2.0',
    changes: [
      {
        title: 'More Languages Supported',
        description: 'EduCure AI is now available in Bulgarian, Vietnamese, Romanian, and Greek languages, expanding our global reach and accessibility.',
        icon: <Globe2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        title: 'Customizable Flashcards and Notes',
        description: 'Enhanced flashcard and notes functionality: now you can edit, delete, and download your flashcards and notes for a more personalized learning experience.',
        icon: <Edit3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        title: 'Subjects',
        description: 'Introduced Subjects - a powerful way to organize your documents for better content management.',
        icon: <FolderKanban className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      }
    ]
  },
  {
    date: 'February 12, 2025',
    version: 'v2.1.0',
    changes: [
      {
        title: 'Enhanced Language Support',
        description: 'Added support for 20+ languages across the platform. Users can now change their preferred language in their profile settings.',
        icon: <Globe2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        title: 'Expanded Voice Features',
        description: 'Lecture recordings feature now supports recording in multiple languages. Vocalize Pro now offers 29 languages for ASMR, and 60+ languages for Motivational and Storytelling content.',
        icon: <Mic2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      },
      {
        title: 'Improved YouTube Integration',
        description: 'Fixed YouTube compatibility issues, where only videos in English were supported. We now support videos in any language, as long as the YouTube video has available transcripts.',
        icon: <Youtube className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      }
    ]
  }
  // Future updates will be added here
];

export default function Updates() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
          >
            <Bell className="h-10 w-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">Latest Updates</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">Stay informed about new features and improvements</p>
        </div>

        <div className="space-y-16">
          {updates.map((update, index) => (
            <motion.div
              key={update.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50 p-8 border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{update.date}</h2>
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-sm font-medium rounded-full border border-emerald-200/50 dark:border-emerald-700/50">
                  {update.version}
                </span>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {update.changes.map((change, changeIndex) => (
                  <motion.div
                    key={changeIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index * 0.1) + (changeIndex * 0.1) }}
                    className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow duration-200 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="w-12 h-12 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center mb-4 shadow-sm dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700">
                      {change.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{change.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{change.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
} 
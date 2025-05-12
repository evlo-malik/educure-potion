import React from 'react';
import { motion } from 'framer-motion';
import { FileUp, BrainCircuit, BookOpen, Zap } from 'lucide-react';

const features = [
  {
    name: 'Easy Upload',
    description: 'Simply drag and drop your PDF notes. Support for multiple file formats coming soon.',
    icon: FileUp,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'AI-Powered Summaries',
    description: 'Advanced AI analyzes your notes and creates concise, meaningful summaries.',
    icon: BrainCircuit,
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    name: 'Smart Flashcards',
    description: 'Automatically generated flashcards with key concepts and important points.',
    icon: BookOpen,
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    name: 'Instant Results',
    description: 'Get your summaries and flashcards within seconds, ready for effective studying.',
    icon: Zap,
    gradient: 'from-amber-500 to-orange-500',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.04, 0.62, 0.23, 0.98],
    },
  },
};

export default function Features() {
  return (
    <div className="bg-white dark:bg-gray-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.h2 
            className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Study Smarter
          </motion.h2>
          <motion.p
            className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            Everything You Need to Ace Your Exams
          </motion.p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none"
        >
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {features.map((feature) => (
              <motion.div
                key={feature.name}
                variants={item}
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-300`} />
                <div className="relative bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg">
                  <div className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-r ${feature.gradient} p-2.5 transform transition-transform group-hover:scale-110 duration-300`}>
                    <feature.icon className="w-full h-full text-white" />
                  </div>
                  <dt className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.name}</dt>
                  <dd className="text-base leading-7 text-gray-600 dark:text-gray-300">{feature.description}</dd>
                </div>
              </motion.div>
            ))}
          </dl>
        </motion.div>
      </div>
    </div>
  );
}
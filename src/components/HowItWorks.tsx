import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileUp,
  Brain,
  MessageSquare,
  BookOpen,
  Volume2,
  Mic,
  Wand2,
  Sparkles,
  Zap,
  ArrowRight,
  FileText,
  BookOpenCheck,
  HelpCircle,
  Youtube,
  MousePointerSquare
} from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';

const features = [
  {
    step: "01",
    title: "Upload Your Materials",
    description: "Start by adding any type of study content you have",
    icon: FileUp,
    color: "from-blue-500 to-cyan-500",
    details: [
      {
        title: "PDF Documents",
        description: "Upload your study materials and textbooks",
        icon: FileText
      },
      {
        title: "YouTube Videos",
        description: "Import educational video content",
        icon: Youtube
      },
      {
        title: "Live Lectures",
        description: "Record your lectures in real-time",
        icon: Mic
      }
    ]
  },
  {
    step: "02",
    title: "Generate Study Materials",
    description: "Transform your content into various study formats",
    icon: BookOpenCheck,
    color: "from-violet-500 to-purple-500",
    details: [
      {
        title: "Smart Notes",
        description: "Get comprehensive study notes in seconds",
        icon: FileText
      },
      {
        title: "Tests and Flashcards",
        description: "Test your knowledge effectively",
        icon: Brain
      },
      {
        title: "Vocalize",
        description: "Audio summaries in the style of your choice (ASMR, Storytelling and more)",
        icon: Volume2
      }
    ]
  },
  {
    step: "03",
    title: "Ask Your AI Tutor",
    description: "Get instant help with any part of your materials",
    icon: HelpCircle,
    color: "from-emerald-500 to-teal-500",
    details: [
      {
        title: "24/7 Chat",
        description: "Ask any question about your documents",
        icon: MessageSquare
      },
      {
        title: "Text Selection",
        description: "Select and ask about any specific paragraph",
        icon: FileText
      },
      {
        title: "Area Selection",
        description: "Select any graph or image in your PDF and ask about it",
        icon: MousePointerSquare
      }
    ]
  }
];

export default function HowItWorks() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const handleCTAClick = () => {
    if (userId) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <section className="py-24 relative w-full">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 via-white/50 to-white/50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900" />
      
      <div className="max-w-[100rem] mx-auto relative px-4">
        <div className="w-full relative" style={{ overflowX: 'clip' }}>
          {/* Section Header */}
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold mb-6"
            >
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Transform your study materials into an interactive learning experience
            </motion.p>
          </div>

          {/* Roadmap */}
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute left-8 sm:left-12 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 dark:from-blue-400 dark:via-purple-400 dark:to-emerald-400 opacity-50 dark:opacity-30" />

            {features.map((feature, index) => (
              <motion.div
                key={feature.step}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="relative mb-16 sm:mb-24 md:mb-32 last:mb-0 pt-8"
              >
                {/* Step Number */}
                <div className="absolute left-8 sm:left-12 md:left-1/2 -translate-x-1/2 top-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-white dark:bg-gray-900 shadow-lg dark:shadow-gray-900/50 border-2 border-indigo-500/50 dark:border-indigo-400/50 flex items-center justify-center text-xs sm:text-sm font-bold text-indigo-500 dark:text-indigo-400 z-10">
                  {feature.step}
                </div>

                <div className="relative pl-16 sm:pl-24 pr-4 md:px-4 lg:px-8">
                  {/* Mobile, Tablet and Desktop layout container */}
                  <div className={`w-full 
                    ${index % 2 === 0 
                      ? 'ml-0 sm:ml-[10%] md:ml-[calc(25%-20rem)]' 
                      : 'ml-0 sm:ml-[25%] md:ml-[calc(75%-20rem)]'
                    }`}
                  >
                    {/* Main Feature */}
                    <div className={`w-full sm:w-[30rem] md:w-[40rem] rounded-3xl shadow-[0_8px_32px_rgb(0,0,0,0.12)] dark:shadow-gray-900/50 px-4 sm:px-6 md:px-10 py-6 sm:py-7 md:py-8 relative overflow-hidden group hover:shadow-[0_16px_48px_rgb(0,0,0,0.2)] dark:hover:shadow-gray-900/70 transition-all duration-500 feature-card ${
                      index === 0 
                        ? 'bg-gradient-to-br from-blue-500 via-cyan-500 to-sky-500 dark:from-blue-600 dark:via-cyan-600 dark:to-sky-600' 
                        : index === 1 
                          ? 'bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 dark:from-violet-600 dark:via-purple-600 dark:to-fuchsia-600'
                          : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 dark:from-emerald-600 dark:via-teal-600 dark:to-cyan-600'
                    }`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-white/5 dark:from-black/20 dark:to-white/10" />
                      
                      {/* Header Section */}
                      <div className="flex items-center gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-7 md:mb-8 relative">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 dark:bg-white/15 backdrop-blur-sm p-2 sm:p-2.5 md:p-3 shadow-lg dark:shadow-black/30 transform transition-transform group-hover:scale-110 duration-500 hover:rotate-3 feature-icon flex-shrink-0`}>
                          <feature.icon className="w-full h-full text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl sm:text-[1.35rem] md:text-2xl font-bold text-white mb-1 sm:mb-1.5 md:mb-2">{feature.title}</h3>
                          <p className="text-base sm:text-lg md:text-lg text-white/90 dark:text-white/80">{feature.description}</p>
                        </div>
                      </div>
                      
                      {/* Details Grid - Stack on mobile, 2 columns on iPad, 3 columns on desktop */}
                      <div className="flex flex-col sm:grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-3.5 md:gap-4 relative">
                        {feature.details.map((detail, i) => (
                          <motion.div
                            key={detail.title}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 + (i * 0.1) }}
                            className="group/card relative bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-3.5 md:p-4 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-500 feature-detail-card"
                          >
                            <div className="relative flex items-start gap-3">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-white/20 dark:bg-white/15 p-1.5 sm:p-1.75 md:p-2 transform transition-transform group-hover/card:scale-110 duration-500 hover:rotate-3 feature-detail-icon flex-shrink-0">
                                <detail.icon className="w-full h-full text-white" />
                              </div>
                              <div className="flex-1 pt-0.5 sm:pt-0.75 md:pt-1">
                                <h4 className="font-semibold text-white text-sm sm:text-base md:text-base mb-0.5 sm:mb-0.75 md:mb-1">{detail.title}</h4>
                                <p className="text-xs sm:text-sm md:text-sm text-white/80 dark:text-white/70 leading-relaxed">{detail.description}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-20"
          >
            <div className="relative inline-block">
              <motion.button
                onClick={handleCTAClick}
                className="relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-500 dark:via-purple-500 dark:to-indigo-500 text-white rounded-xl font-semibold overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Animated background layers */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-500 dark:via-purple-500 dark:to-indigo-500 animate-gradient-x" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.15),transparent_50%)]" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </div>
                
                {/* Electric border effect */}
                <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 rounded-xl opacity-0 group-hover:opacity-100 blur-lg transition-all duration-500 group-hover:blur-xl animate-gradient-x" />
                
                {/* Content */}
                <div className="relative flex items-center gap-2 z-10">
                  <span>{userId ? 'Go to Dashboard' : 'Get Started Free'}</span>
                  <motion.div
                    animate={{ 
                      x: [0, 5, 0],
                      opacity: [1, 0.5, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </div>

                {/* Sparkle effects */}
                <div className="absolute inset-0">
                  <div className="absolute h-[300%] w-[100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-20 group-hover:opacity-100 dark:opacity-15 dark:group-hover:opacity-80 transition-opacity duration-500 animate-spin-slow" />
                </div>
              </motion.button>
            </div>
          </motion.div>

          <style>{`
            @keyframes shimmer {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(100%);
              }
            }

            @keyframes gradient-x {
              0%, 100% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
            }

            .animate-gradient-x {
              animation: gradient-x 3s linear infinite;
              background-size: 200% 100%;
            }

            .animate-shimmer {
              animation: shimmer 2s infinite;
            }

            .animate-spin-slow {
              animation: spin 4s linear infinite;
            }

            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    </section>
  );
}
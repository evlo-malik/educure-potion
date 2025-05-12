import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, FileUp, BookOpen, BrainCircuit, Sparkles, Brain, Zap, MessageSquare, FileText, Volume2 } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import HowItWorks from './HowItWorks';

const universities = [
  { 
    name: 'Imperial College London', 
    logo: 'https://www.imperial.ac.uk/ImageCropToolT4/imageTool/uploaded-images/White-on-navy--tojpeg_1495792347019_x1.jpg' 
  },
  { 
    name: 'MIT', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/2560px-MIT_logo.svg.png' 
  },
  { 
    name: 'Stanford', 
    logo: 'https://evlo-malik.github.io/uni-logos/clipart3353328.png' 
  },
  { 
    name: 'Harvard', 
    logo: 'https://1000logos.net/wp-content/uploads/2017/02/Harvard-Logo.png'
  },
  { 
    name: 'Oxford', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Oxford-University-Circlet.svg/1636px-Oxford-University-Circlet.svg.png' 
  },
  { 
    name: 'Cambridge', 
    logo: 'https://evlo-malik.github.io/uni-logos/cdnlogo.com_university-of-cambridge.png' 
  },
  {
    name: 'ETH Zurich',
    logo: 'https://ethz.ch/etc/designs/ethz/img/header/ethz_logo_black.svg'
  },
  {
    name: 'Caltech',
    logo: 'https://evlo-malik.github.io/uni-logos/caltech-logo.png'
  },
  {
    name: 'Princeton',
    logo: 'https://evlo-malik.github.io/uni-logos/Princeton_seal.svg'
  },
  {
    name: 'Yale',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Yale_University_logo.svg/1200px-Yale_University_logo.svg.png'
  },
  {
    name: 'UCL',
    logo: 'https://evlo-malik.github.io/uni-logos/9e148174556eba6080cac874888bcdfd.png'
  },
  {
    name: 'Berkeley',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/82/University_of_California%2C_Berkeley_logo.svg'
  },
  {
    name: 'LSE',
    logo: 'https://evlo-malik.github.io/uni-logos/LSE_Logo.svg'
  },
  {
    name: 'EHL',
    logo: 'https://evlo-malik.github.io/uni-logos/256px-EHL_Logo.png'
  }
];

// Duplicate the array to create a seamless loop
const duplicatedUniversities = [...universities, ...universities];

export default function Hero() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');

  const handleCTAClick = () => {
    if (userId) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="bg-gradient-to-b from-indigo-50/50 via-white/50 to-white/50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <div className="relative">
        <AnimatedBackground />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-3xl"
          >
            {/* Animated Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 1.5
              }}
              className="relative w-64 h-64 mx-auto mb-12"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative w-full h-full"
              >
                <img
                  src="https://evlo-malik.github.io/uni-logos/2.png"
                  alt="EduCure AI Logo"
                  className="w-full h-full object-contain"
                />
                <motion.div
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-xl"
                />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-6xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent sm:text-7xl"
            >
              EduCure AI
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-6 text-xl leading-8 text-gray-600 dark:text-gray-300"
            >
              Transform your study materials into an interactive learning experience powered by advanced AI technology
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-10 flex items-center justify-center gap-x-6"
            >
              <div className="relative">
                <motion.button
                  onClick={handleCTAClick}
                  className="group relative px-8 py-4 rounded-2xl bg-[#6366F1] overflow-hidden shadow-[0_0_0_3px_rgba(99,102,241,0.2)] hover:shadow-[0_0_0_3px_rgba(99,102,241,0.4)] transition-all duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-shimmer-slow" />
                  
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl opacity-30 group-hover:opacity-50 blur-lg transition-all duration-300 group-hover:blur-xl animate-glow" />
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  </div>
                  
                  {/* Electric border effect */}
                  <div className="absolute inset-0 rounded-2xl">
                    <div className="absolute inset-0 bg-[length:100px_100px] bg-[radial-gradient(circle_8px_at_center,rgba(255,255,255,0.2)_98%,transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content */}
                  <div className="relative flex items-center gap-2 text-lg font-semibold text-white">
                    <span>{userId ? 'Go to Dashboard' : 'Get Started For Free'}</span>
                    <motion.div
                      animate={{ 
                        x: [0, 4, 0],
                        opacity: [1, 0.7, 1]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  </div>

                  {/* Particle effects */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </motion.button>
              </div>
            </motion.div>

            <style>{`
              @keyframes shimmer-slow {
                0% {
                  background-position: 0% 50%;
                }
                100% {
                  background-position: 200% 50%;
                }
              }

              .animate-shimmer-slow {
                animation: shimmer-slow 8s linear infinite;
              }

              @keyframes glow {
                0%, 100% {
                  opacity: 0.3;
                }
                50% {
                  opacity: 0.5;
                }
              }

              .animate-glow {
                animation: glow 2s ease-in-out infinite;
              }
            `}</style>
          </motion.div>
        </div>

        {/* Universities Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative w-full overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
            <h2 className="text-3xl font-bold text-center mb-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Trusted by Students from The World's Leading Universities
            </h2>

            {/* Auto-scrolling marquee effect */}
            <div className="relative py-12 overflow-hidden">
              {/* Single row for larger screens, two rows for mobile/tablet */}
              <div className="hidden lg:flex space-x-12 animate-[scroll_60s_linear_infinite] w-max">
                {[...universities, ...universities, ...universities, ...universities].map((uni, index) => (
                  <motion.div
                    key={`${uni.name}-${index}`}
                    whileHover={{ scale: 1.05 }}
                    className="relative flex-shrink-0 group"
                  >
                    <div className="relative bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-800/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 w-48">
                      <img
                        src={uni.logo}
                        alt={uni.name}
                        className="h-16 w-auto object-contain mx-auto transition-all duration-300"
                      />
                      
                      {/* University name tooltip */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                        <div className="bg-gray-900/90 dark:bg-gray-800/90 text-white text-sm px-3 py-1 rounded-full whitespace-nowrap">
                          {uni.name}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Mobile/Tablet View - Two Rows */}
              <div className="lg:hidden">
                {/* First row */}
                <div className="flex space-x-8 sm:space-x-12 animate-[scroll_60s_linear_infinite] w-max">
                  {[...universities, ...universities, ...universities].map((uni, index) => (
                    <motion.div
                      key={`${uni.name}-${index}`}
                      whileHover={{ scale: 1.05 }}
                      className="relative flex-shrink-0 group"
                    >
                      <div className="relative bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-800/50 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 w-32 sm:w-40">
                        <img
                          src={uni.logo}
                          alt={uni.name}
                          className="h-12 sm:h-14 w-auto object-contain mx-auto transition-all duration-300"
                        />
                        
                        {/* University name tooltip */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                          <div className="bg-gray-900/90 dark:bg-gray-800/90 text-white text-xs sm:text-sm px-3 py-1 rounded-full whitespace-nowrap">
                            {uni.name}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Second row */}
                <div className="flex space-x-8 sm:space-x-12 mt-8 animate-[scroll_60s_linear_infinite_reverse] w-max">
                  {[...universities.slice().reverse(), ...universities.slice().reverse(), ...universities.slice().reverse()].map((uni, index) => (
                    <motion.div
                      key={`${uni.name}-reverse-${index}`}
                      whileHover={{ scale: 1.05 }}
                      className="relative flex-shrink-0 group"
                    >
                      <div className="relative bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-800/50 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 w-32 sm:w-40">
                        <img
                          src={uni.logo}
                          alt={uni.name}
                          className="h-12 sm:h-14 w-auto object-contain mx-auto transition-all duration-300"
                        />
                        
                        {/* University name tooltip */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                          <div className="bg-gray-900/90 dark:bg-gray-800/90 text-white text-xs sm:text-sm px-3 py-1 rounded-full whitespace-nowrap">
                            {uni.name}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <style>{`
              @keyframes scroll {
                0% {
                  transform: translateX(0);
                }
                100% {
                  transform: translateX(calc(-50% - 1.5rem));
                }
              }
            `}</style>
          </div>
        </motion.div>

        {/* How It Works Section */}
        <HowItWorks />

        {/* Study Smarter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative py-24 bg-white dark:bg-gray-900"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Why Students Love Us
                </span>
              </h2>
              <p className="text-xl text-gray-600/90 dark:text-gray-400/90">
                Join thousands of successful students who improved their grades with EduCure AI
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Success Rate Card */}
              <motion.div
                whileHover={{ y: -8 }}
                className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-3xl p-6 text-white text-center shadow-xl dark:shadow-blue-500/20 backdrop-blur-xl"
              >
                <div className="text-5xl font-bold mb-4 text-white">94%</div>
                <div className="text-xl font-semibold mb-2 text-white">Success Rate</div>
                <p className="text-white/90">of our students improve their grades within the first month</p>
              </motion.div>

              {/* Time Saved Card */}
              <motion.div
                whileHover={{ y: -8 }}
                className="bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 rounded-3xl p-6 text-white text-center shadow-xl dark:shadow-purple-500/20 backdrop-blur-xl"
              >
                <div className="text-5xl font-bold mb-4 text-white">70%</div>
                <div className="text-xl font-semibold mb-2 text-white">Time Saved</div>
                <p className="text-white/90">study more efficiently with our AI-powered tools</p>
              </motion.div>

              {/* Student Rating Card */}
              <motion.div
                whileHover={{ y: -8 }}
                className="bg-gradient-to-br from-pink-500 via-pink-600 to-rose-600 rounded-3xl p-6 text-white text-center shadow-xl dark:shadow-pink-500/20 backdrop-blur-xl"
              >
                <div className="text-5xl font-bold mb-4 text-white">4.9/5</div>
                <div className="text-xl font-semibold mb-2 text-white">Student Rating</div>
                <p className="text-white/90">average rating from over 10,000 students</p>
              </motion.div>
            </div>

            <div className="mt-16 text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <button
                  onClick={handleCTAClick}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 dark:shadow-indigo-500/20 backdrop-blur-xl"
                >
                  Start Improving Your Grades Today
                </button>
              </motion.div>
              <p className="mt-4 text-gray-500/80 dark:text-gray-400/80">
                Try our free plan today. No credit card required.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
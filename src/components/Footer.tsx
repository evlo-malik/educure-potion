import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Instagram,
  Linkedin, 
  Mail,
  MapPin,
  Phone,
  BookOpen,
  Brain,
  Sparkles,
  Shield,
  X,
  FileUp,
  BrainCircuit,
  Zap
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="https://evlo-malik.github.io/uni-logos/2.png"
                alt="EduCure AI Logo"
                className="h-8 w-8 object-contain"
              />
              <span className="text-xl font-bold">
                <span className="text-gray-900 dark:text-white">Edu</span>
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Cure AI</span>
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Transforming education through AI-powered learning experiences. Making study materials more accessible and effective.
            </p>
            <div className="flex space-x-4">
              <a href="https://x.com/EduCureio" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors">
                <X className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/official.educure.io/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/features" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">Features</Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">Pricing</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Features</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <FileUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Easy Upload</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <BrainCircuit className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>AI-Powered Summaries</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Smart Flashcards</span>
              </li>
              <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Instant Results</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <a href="mailto:support@educure.ai" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  admin@educure.io
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              © {currentYear} EduCure AI. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/privacy" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
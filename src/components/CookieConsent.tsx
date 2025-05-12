import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cookie, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { saveUserInfo, getUserInfo } from '../lib/cookies';

interface CookieConsentProps {
  userId?: string | null;
}

export default function CookieConsent({ userId }: CookieConsentProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkPreferences = async () => {
      if (userId) {
        const userInfo = await getUserInfo(userId);
        if (!userInfo?.cookiePreferences) {
          setShowBanner(true);
        }
      } else {
        const localPreference = localStorage.getItem('cookiePreferences');
        if (!localPreference) {
          setShowBanner(true);
        }
      }
    };

    checkPreferences();
  }, [userId]);

  const handleAccept = async (acceptAll: boolean) => {
    if (userId) {
      await saveUserInfo(userId, acceptAll);
    } else {
      localStorage.setItem('cookiePreferences', JSON.stringify({ acceptAll }));
    }
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl border border-gray-200"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Cookie className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Cookie Settings</h2>
              <p className="text-sm text-gray-500">Manage your cookie preferences</p>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            We use cookies and collect certain information to enhance your experience and improve our service. 
            This includes basic information like your name, email, and phone number along with technical data 
            about your device and usage patterns.
          </p>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-500 mb-6"
          >
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>

          {showDetails && (
            <div className="mb-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-medium text-gray-900">Information We Collect</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-2 ml-6 list-disc">
                  <li>Name, email, and phone number from your profile</li>
                  <li>Device information (browser, OS, screen resolution)</li>
                  <li>Usage patterns and preferences</li>
                  <li>IP address and location data</li>
                  <li>Visit frequency and duration</li>
                </ul>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => handleAccept(true)}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition-colors"
            >
              Accept All Cookies
            </button>
            <button
              onClick={() => handleAccept(false)}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Accept Necessary Only
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
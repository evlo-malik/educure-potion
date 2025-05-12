import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(i18n.language || 'en');

  const setLanguage = async (newLanguage: string) => {
    try {
      // Change i18n language
      await i18n.changeLanguage(newLanguage);
      
      // Update state
      setLanguageState(newLanguage);
      
      // Save to localStorage
      localStorage.setItem('userLanguage', newLanguage);

      // If user is logged in, update Firestore
      const currentUser = auth.currentUser;
      if (currentUser) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          await updateDoc(userDoc.ref, {
            language: newLanguage
          });
        }
      }
    } catch (error) {
      console.error('Error setting language:', error);
      throw error;
    }
  };

  // Effect to handle initial language setup and browser language detection
  useEffect(() => {
    const loadUserLanguage = async () => {
      try {
        // First check localStorage
        const storedLanguage = localStorage.getItem('userLanguage');
        
        // If browser language is available and different from stored language, use it
        const browserLang = i18n.language;
        if (browserLang && (!storedLanguage || browserLang !== storedLanguage)) {
          await setLanguage(browserLang);
          return;
        }

        // If stored language exists, use it
        if (storedLanguage) {
          await setLanguage(storedLanguage);
          return;
        }

        // If not in localStorage, check user's settings in Firestore
        const currentUser = auth.currentUser;
        if (currentUser) {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('uid', '==', currentUser.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            if (userData.language) {
              await setLanguage(userData.language);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user language:', error);
      }
    };

    loadUserLanguage();
  }, []);

  // Effect to sync with i18n language changes
  useEffect(() => {
    const syncLanguage = async () => {
      if (i18n.language && i18n.language !== language) {
        await setLanguage(i18n.language);
      }
    };
    
    syncLanguage();
  }, [i18n.language]);

  const value = {
    language,
    setLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
} 
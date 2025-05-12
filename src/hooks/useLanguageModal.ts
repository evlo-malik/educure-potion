import { useState, useEffect } from 'react';

export function useLanguageModal() {
  const [isOpen, setIsOpen] = useState(false);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    // Only show on dashboard for signed-in users
    if (window.location.pathname === '/dashboard' && userId) {
      const hasSelectedLanguage = localStorage.getItem('hasSelectedLanguage');
      
      // Add a small delay to not overlap with other modals
      const timer = setTimeout(() => {
        if (!hasSelectedLanguage) {
          setIsOpen(true);
        }
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, [userId]);

  const closeModal = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    closeModal
  };
} 
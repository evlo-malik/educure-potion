import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoadingOverlay from '../components/LoadingOverlay';

interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState<{ isVisible: boolean; message?: string }>({
    isVisible: false
  });

  const showLoading = useCallback((message?: string) => {
    setLoading({ isVisible: true, message });
  }, []);

  const hideLoading = useCallback(() => {
    setLoading({ isVisible: false });
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      <AnimatePresence>
        {loading.isVisible && <LoadingOverlay message={loading.message} />}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
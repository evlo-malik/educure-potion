import { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

const LATEST_UPDATE_DATE = '2025-02-12';
const UPDATE_NOTIFICATION_KEY = 'last_update_notification';

export function useUpdateNotification() {
  const { showToast } = useToast();

  useEffect(() => {
    const lastNotification = localStorage.getItem(UPDATE_NOTIFICATION_KEY);
    
    if (!lastNotification || lastNotification < LATEST_UPDATE_DATE) {
      showToast(
        'We\'ve added new languages and features! Check out our Updates page to learn more.',
        'info'
      );
      localStorage.setItem(UPDATE_NOTIFICATION_KEY, LATEST_UPDATE_DATE);
    }
  }, [showToast]);
} 
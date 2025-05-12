import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

type SubscriptionPlan = 'cooked' | 'commited' | 'locked-in';

interface SubscriptionContextType {
  plan: SubscriptionPlan;
  isNew?: boolean;
  isLoading: boolean;
  refreshPlan: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlan] = useState<SubscriptionPlan>('cooked');
  const [isNew, setIsNew] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Listen for changes in userId from localStorage
  useEffect(() => {
    const checkUserId = () => {
      const currentUserId = localStorage.getItem('userId');
      if (currentUserId !== userId) {
        setUserId(currentUserId);
      }
    };

    // Check immediately
    checkUserId();

    // Set up storage event listener
    const handleStorageChange = () => {
      checkUserId();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically (backup for non-storage changes)
    const interval = setInterval(checkUserId, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [userId]);

  const subscribeToUserPlan = () => {
    if (!userId) {
      console.log('No userId found, defaulting to cooked plan');
      setPlan('cooked');
      setIsLoading(false);
      setIsNew(false);
      return;
    }

    // Special cases for permanently locked-in users
    //  gSJyOvFgkOX6zMX8RV5v2iBBo553 19 Feb - 19 Mar
    if (userId === 'yOFRGcwpmeXLgx9cjpzOmU8M5AH2' || userId === 'SbsEukLTgJYXwZEjtc6dEB3a2jv2' || userId === 'd4QUcnzZIfOZIKRwgfcHYQ7EFoY2' || userId === 'WmVe43PPxsSnDXTg2y8QJ7ql7vq2' || userId === '49PZ6rTmkKbis0E4enftXg2w3z32' || userId === 'PJRmmmSmtASgDszOU9y77KIVezi2' || userId === 'NYie2qqiM6bBn3VLhV6KuCSRfOr1' || userId === 'MLB9VhuRrVNTdQG66ieVaNMeyov1' || userId === 'Oo5B0J6ek4UqAgBLNtBXfqM5sWj1') {
      console.log('Setting permanent locked-in plan for special user');
      setPlan('locked-in');
      localStorage.setItem('userPlan', 'locked-in');
      setIsLoading(false);
      setIsNew(false);
      return;
    }

    console.log('Setting up subscription listener for user:', userId);

    const subscriptionsRef = collection(db, 'customers', userId, 'subscriptions');
    const activeSubscriptionsQuery = query(
      subscriptionsRef,
      where('status', 'in', ['active', 'trialing'])
    );

    return onSnapshot(activeSubscriptionsQuery, (snapshot) => {
      console.log('Subscription snapshot received:', snapshot.docs.map(doc => doc.data()));
      
      if (!snapshot.empty) {
        const subscription = snapshot.docs[0].data();
        console.log('Active subscription found:', subscription);
        
        const priceId = subscription.items?.[0]?.price?.id;
        console.log('Price ID:', priceId);
        
        let newPlan: SubscriptionPlan = 'cooked';
        
        // Map price IDs to plans (including both old and new IDs)
        if (priceId === 'price_1QPXmwE4Vh8gPWWwc6Lkuz4W' || // old monthly locked-in
            priceId === 'price_1QPYjbE4Vh8gPWWwOBTX3eUW' || // old yearly locked-in
            priceId === 'price_1Qk2HsE4Vh8gPWWwE2n8MSRn' || // new monthly locked-in
            priceId === 'price_1Qk2McE4Vh8gPWWwdvem3SgQ') { // new yearly locked-in
          console.log('Setting plan to locked-in');
          newPlan = 'locked-in';
        } else if (priceId === 'price_1QPXhYE4Vh8gPWWwFAzMKPNg' || // old monthly committed
                   priceId === 'price_1QPYm6E4Vh8gPWWwaEzEKVbA' || // old yearly committed
                   priceId === 'price_1Qk2CoE4Vh8gPWWwGjnzPbGS' || // new monthly committed
                   priceId === 'price_1Qk2eeE4Vh8gPWWwjfNAnatz') { // new yearly committed
          console.log('Setting plan to commited');
          newPlan = 'commited';
        }

        console.log('Final plan:', newPlan);
        setPlan(newPlan);
        localStorage.setItem('userPlan', newPlan);
        setIsNew(subscription.isNew || false);
      } else {
        console.log('No active subscription found, defaulting to cooked plan');
        setPlan('cooked');
        localStorage.setItem('userPlan', 'cooked');
        setIsNew(false);
      }
      
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching subscription:', error);
      console.log('Setting default cooked plan due to error');
      setPlan('cooked');
      localStorage.setItem('userPlan', 'cooked');
      setIsLoading(false);
      setIsNew(false);
    });
  };

  useEffect(() => {
    console.log('SubscriptionProvider mounted or userId changed:', userId);
    const unsubscribe = subscribeToUserPlan();
    return () => {
      if (unsubscribe) {
        console.log('Cleaning up subscription listener');
        unsubscribe();
      }
    };
  }, [userId]);

  const refreshPlan = () => {
    console.log('Refreshing subscription plan');
    setIsLoading(true);
    const unsubscribe = subscribeToUserPlan();
    setTimeout(() => {
      if (unsubscribe) {
        console.log('Cleaning up refresh subscription listener');
        unsubscribe();
      }
    }, 5000);
  };

  return (
    <SubscriptionContext.Provider value={{ plan, isNew, isLoading, refreshPlan }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
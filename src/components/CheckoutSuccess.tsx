import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, X } from 'lucide-react';
import { getSubscriptionStatus } from '../lib/stripe';
import { useSubscription } from '../contexts/SubscriptionContext';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');
  const userId = localStorage.getItem('userId');
  const { refreshPlan } = useSubscription();

  useEffect(() => {
    const verifySubscription = async () => {
      if (!sessionId || !userId) {
        setError('Invalid checkout session');
        setIsLoading(false);
        return;
      }

      try {
        // Poll for subscription status every 2 seconds for up to 30 seconds
        let attempts = 0;
        const maxAttempts = 15;
        const pollInterval = 2000;

        const checkSubscription = async () => {
          const subscription = await getSubscriptionStatus(userId);
          console.log('Current subscription status:', subscription);
          
          if (subscription?.status === 'active' || subscription?.status === 'trialing') {
            // Update subscription context
            refreshPlan();
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
            return true;
          }
          
          return false;
        };

        const pollSubscription = async () => {
          if (attempts >= maxAttempts) {
            setError('Subscription verification timed out. The payment was successful, but please contact support if the issue persists.');
            return;
          }

          console.log(`Polling attempt ${attempts + 1}/${maxAttempts}`);
          const isVerified = await checkSubscription();
          if (!isVerified) {
            attempts++;
            setTimeout(pollSubscription, pollInterval);
          }
        };

        await pollSubscription();
      } catch (error) {
        console.error('Subscription verification error:', error);
        setError('Failed to verify subscription. The payment was successful, but please contact support if the issue persists.');
      } finally {
        setIsLoading(false);
      }
    };

    verifySubscription();
  }, [sessionId, userId, navigate, refreshPlan]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Your Subscription
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your payment...
            </p>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Something Went Wrong
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for subscribing. You will be redirected to your dashboard shortly.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
              <motion.div
                className="bg-green-600 h-1 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3 }}
              />
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

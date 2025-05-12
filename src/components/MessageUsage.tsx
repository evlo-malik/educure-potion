import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Wand2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMessageUsage, processUnprocessedPayments } from '../lib/messageUsage';
import { useSubscription } from '../contexts/SubscriptionContext';

interface MessageUsageProps {
  userId: string;
  translations: {
    textMessages: string;
    areaSelection: string;
    planUsageDaily: string;
    planUsageWeekly: string;
    purchasedMessages: string;
    buyMore: string;
    infinity: string;
  };
}

const PLAN_LIMITS = {
  cooked: {
    dailyTextMessages: 3,
    weeklyAreaMessages: 1
  },
  commited: {
    dailyTextMessages: 30,
    weeklyAreaMessages: 15
  },
  'locked-in': {
    dailyTextMessages: Infinity,
    weeklyAreaMessages: 50
  }
};

export default function MessageUsage({ userId, translations }: MessageUsageProps) {
  const [usage, setUsage] = useState({
    textMessages: 0,
    areaMessages: 0,
    purchasedTextMessages: 0,
    purchasedAreaMessages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { plan } = useSubscription();

  useEffect(() => {
    const loadUsage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Process any unprocessed message purchases first
        await processUnprocessedPayments(userId);

        // Then get current usage
        const currentUsage = await getMessageUsage(userId);
        setUsage(currentUsage);
      } catch (error) {
        console.error('Error loading message usage:', error);
        setError('Failed to load message usage');
      } finally {
        setIsLoading(false);
      }
    };

    loadUsage();
  }, [userId]);

  const getPlanLimit = (type: 'text' | 'area') => {
    if (!plan) return 0;
    return type === 'text' 
      ? PLAN_LIMITS[plan].dailyTextMessages 
      : PLAN_LIMITS[plan].weeklyAreaMessages;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === Infinity) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-red-800 dark:text-red-200 font-medium">Error loading message usage</p>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Text Messages */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{translations.textMessages}</h3>
          </div>
          <Link
            to="/purchase-messages"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center gap-1 group"
          >
            {translations.buyMore}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="space-y-2">
          {/* Plan Usage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">{translations.planUsageDaily}</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {usage.textMessages} / {getPlanLimit('text') === Infinity ? translations.infinity : getPlanLimit('text')}
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getUsagePercentage(usage.textMessages, getPlanLimit('text'))}%` }}
                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
              />
            </div>
          </div>

          {/* Purchased Messages */}
          {usage.purchasedTextMessages > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">{translations.purchasedMessages}</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">{usage.purchasedTextMessages}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 dark:bg-green-400 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Area Messages */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{translations.areaSelection}</h3>
          </div>
          <Link
            to="/purchase-messages"
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 flex items-center gap-1 group"
          >
            {translations.buyMore}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="space-y-2">
          {/* Plan Usage */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">{translations.planUsageWeekly}</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {usage.areaMessages} / {getPlanLimit('area')}
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getUsagePercentage(usage.areaMessages, getPlanLimit('area'))}%` }}
                className="h-full bg-purple-600 dark:bg-purple-500 rounded-full"
              />
            </div>
          </div>

          {/* Purchased Messages */}
          {usage.purchasedAreaMessages > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-400">{translations.purchasedMessages}</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">{usage.purchasedAreaMessages}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 dark:bg-green-400 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
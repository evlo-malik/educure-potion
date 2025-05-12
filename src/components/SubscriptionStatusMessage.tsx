import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ArrowUpCircle, ArrowDownCircle, X } from 'lucide-react';

interface SubscriptionStatusMessageProps {
  action: 'cancel' | 'upgrade' | 'downgrade';
  currentPeriodEnd?: number;
  newPlan?: string;
  onClose: () => void;
}

export default function SubscriptionStatusMessage({ 
  action, 
  currentPeriodEnd,
  newPlan,
  onClose 
}: SubscriptionStatusMessageProps) {
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMessage = () => {
    switch (action) {
      case 'cancel':
        return {
          title: 'Subscription Cancelled',
          message: `Your subscription will remain active until ${formatDate(currentPeriodEnd)}. After this date, you'll return to the free plan. You can resubscribe anytime to restore your premium features.`,
          icon: Calendar,
          gradient: 'from-amber-500 to-red-500'
        };
      case 'upgrade':
        return {
          title: 'Subscription Upgraded',
          message: `Your subscription has been upgraded to ${newPlan}. The price difference has been prorated for your current billing period, and you now have immediate access to all ${newPlan} features.`,
          icon: ArrowUpCircle,
          gradient: 'from-green-500 to-emerald-500'
        };
      case 'downgrade':
        return {
          title: 'Subscription Change Scheduled',
          message: `Your subscription will change to ${newPlan} on ${formatDate(currentPeriodEnd)}. Until then, you'll maintain access to all your current features. The new price will take effect at your next billing date.`,
          icon: ArrowDownCircle,
          gradient: 'from-blue-500 to-indigo-500'
        };
      default:
        return null;
    }
  };

  const content = getMessage();
  if (!content) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 max-w-md w-full bg-white rounded-lg shadow-xl border border-gray-100 p-6 z-50"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${content.gradient} p-2 flex-shrink-0`}>
            <content.icon className="w-full h-full text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{content.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{content.message}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
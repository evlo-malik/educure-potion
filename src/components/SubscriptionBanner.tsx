import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SubscriptionBannerProps {
  daysLeft: number;
}

export default function SubscriptionBanner({ daysLeft }: SubscriptionBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-amber-50 to-red-50 border-b border-amber-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-amber-800">
              {daysLeft <= 0 ? (
                'Your subscription has expired'
              ) : (
                `Your subscription will expire in ${daysLeft} days`
              )}
            </p>
          </div>
          <Link
            to="/pricing"
            className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-red-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105"
          >
            Renew Now
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
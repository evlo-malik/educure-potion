import React, { useEffect, useState } from 'react';
import { MessageSquare, MousePointerSquare } from 'lucide-react';
import { getMessageUsage } from '../lib/messageUsage';
import { useSubscription } from '../contexts/SubscriptionContext';

interface MessageLimitIndicatorProps {
  userId: string;
}

export default function MessageLimitIndicator({ userId }: MessageLimitIndicatorProps) {
  const [usage, setUsage] = useState({ textMessages: 0, areaMessages: 0 });
  const { plan } = useSubscription();

  useEffect(() => {
    const loadUsage = async () => {
      const currentUsage = await getMessageUsage(userId);
      setUsage(currentUsage);
    };
    loadUsage();
  }, [userId]);

  const getLimits = () => {
    switch (plan) {
      case 'cooked':
        return { text: 3, area: 1 };
      case 'commited':
        return { text: 30, area: 15 };
      case 'locked-in':
        return { text: '∞', area: 50 };
      default:
        return { text: 0, area: 0 };
    }
  };

  const limits = getLimits();
  
  const remainingText = limits.text === '∞' ? '∞' : Math.max(0, Number(limits.text) - usage.textMessages);
  const remainingArea = Math.max(0, limits.area - usage.areaMessages);

  return (
    <div className="px-3 py-2 border-b">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-600" />
          <span className="text-sm text-gray-600">
            {remainingText} text messages left
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MousePointerSquare className="h-4 w-4 text-indigo-600" />
          <span className="text-sm text-gray-600">
            {remainingArea} area messages left
          </span>
        </div>
      </div>
    </div>
  );
}

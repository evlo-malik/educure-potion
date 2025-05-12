import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function ThinkingAnimation() {
  return (
    <div className="flex items-start gap-2 animate-scaleIn">
      <div className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center mt-0.5 bg-indigo-100">
        <MessageSquare className="h-3 w-3 text-indigo-600" />
      </div>
      <div className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-50">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
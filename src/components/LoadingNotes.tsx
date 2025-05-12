import React from 'react';

interface LoadingNotesProps {
  className?: string;
}

export default function LoadingNotes({ className = '' }: LoadingNotesProps) {
  return (
    <div className={`${className} relative`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Paper */}
        <rect
          x="3"
          y="2"
          width="18"
          height="20"
          rx="2"
          className="stroke-emerald-600"
          strokeWidth="2"
          fill="white"
        />
        
        {/* Lines */}
        <line
          x1="7"
          y1="7"
          x2="17"
          y2="7"
          className="stroke-emerald-600 animate-write delay-100"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="7"
          y1="11"
          x2="17"
          y2="11"
          className="stroke-emerald-600 animate-write delay-200"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="7"
          y1="15"
          x2="13"
          y2="15"
          className="stroke-emerald-600 animate-write delay-300"
          strokeWidth="2"
          strokeLinecap="round"
        />
        
        {/* Pencil */}
        <path
          d="M20 6L18 4L16 6L18 8L20 6Z"
          fill="#047857"
          className="animate-pencil-move"
        />
        <path
          d="M18 8L16 6L8 14V16H10L18 8Z"
          fill="#059669"
          className="animate-pencil-move"
        />
      </svg>
    </div>
  );
}
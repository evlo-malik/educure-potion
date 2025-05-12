import React from 'react';

interface LoadingTestProps {
  className?: string;
}

export default function LoadingTest({ className = '' }: LoadingTestProps) {
  return (
    <div className={`${className} relative`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Paper background */}
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="2"
          className="fill-white stroke-violet-600"
          strokeWidth="2"
        />
        
        {/* Checkboxes and options */}
        <g className="animate-option animate-option-1">
          <rect
            x="4"
            y="5"
            width="3"
            height="3"
            className="stroke-violet-600"
            strokeWidth="2"
            fill="none"
          />
          <line
            x1="9"
            y1="6.5"
            x2="18"
            y2="6.5"
            className="stroke-violet-600 animate-write"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        
        <g className="animate-option animate-option-2">
          <rect
            x="4"
            y="10"
            width="3"
            height="3"
            className="stroke-violet-600"
            strokeWidth="2"
            fill="none"
          />
          <line
            x1="9"
            y1="11.5"
            x2="18"
            y2="11.5"
            className="stroke-violet-600 animate-write"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        
        <g className="animate-option animate-option-3">
          <rect
            x="4"
            y="15"
            width="3"
            height="3"
            className="stroke-violet-600"
            strokeWidth="2"
            fill="none"
          />
          <line
            x1="9"
            y1="16.5"
            x2="18"
            y2="16.5"
            className="stroke-violet-600 animate-write"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        
        {/* Animated checkmark */}
        <path
          d="M5 6.5L6 7.5L7 5.5"
          className="stroke-violet-600 animate-checkbox"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
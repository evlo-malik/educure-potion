import React from 'react';

interface LoadingBookProps {
  className?: string;
}

export default function LoadingBook({ className = '' }: LoadingBookProps) {
  return (
    <div className={`${className} relative`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <path
          d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20"
          className="animate-book-spine"
          stroke="#4F46E5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z"
          stroke="#4F46E5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-book-cover"
        />
        <path
          d="M8 7H16"
          stroke="#4F46E5"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-book-line delay-100"
        />
        <path
          d="M8 12H16"
          stroke="#4F46E5"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-book-line delay-200"
        />
        <path
          d="M8 17H12"
          stroke="#4F46E5"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-book-line delay-300"
        />
      </svg>
    </div>
  );
}
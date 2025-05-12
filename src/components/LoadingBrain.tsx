import React from 'react';

interface LoadingBrainProps {
  className?: string;
}

export default function LoadingBrain({ className = '' }: LoadingBrainProps) {
  return (
    <div className={`${className} relative`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Brain outline */}
        <path
          d="M12 4.5C11.3509 3.60309 10.2603 3 9 3C6.79086 3 5 4.79086 5 7C5 7.11305 5.00541 7.22516 5.01601 7.33618M12 4.5C12.6491 3.60309 13.7397 3 15 3C17.2091 3 19 4.79086 19 7C19 7.11305 18.9946 7.22516 18.984 7.33618M12 4.5V21M5.01601 7.33618C3.83521 7.88168 3 9.0726 3 10.5C3 11.6435 3.5035 12.6681 4.31147 13.3506M5.01601 7.33618C5.18174 7.29919 5.35441 7.27919 5.53241 7.27819M18.984 7.33618C20.1648 7.88168 21 9.0726 21 10.5C21 11.6435 20.4965 12.6681 19.6885 13.3506M18.984 7.33618C18.8183 7.29919 18.6456 7.27919 18.4676 7.27819M4.31147 13.3506C3.51329 14.0265 3 15.0492 3 16.2C3 17.8802 4.18259 19.2252 5.75741 19.4524M4.31147 13.3506C4.5858 13.5591 4.89008 13.7298 5.21576 13.8541M19.6885 13.3506C20.4867 14.0265 21 15.0492 21 16.2C21 17.8802 19.8174 19.2252 18.2426 19.4524M19.6885 13.3506C19.4142 13.5591 19.1099 13.7298 18.7842 13.8541"
          stroke="#4F46E5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-brain-outline"
        />
        
        {/* Synapses */}
        <circle
          cx="8"
          cy="10"
          r="1"
          fill="#4F46E5"
          className="animate-synapse delay-100"
        />
        <circle
          cx="16"
          cy="10"
          r="1"
          fill="#4F46E5"
          className="animate-synapse delay-200"
        />
        <circle
          cx="12"
          cy="12"
          r="1"
          fill="#4F46E5"
          className="animate-synapse delay-300"
        />
        <circle
          cx="7"
          cy="15"
          r="1"
          fill="#4F46E5"
          className="animate-synapse delay-400"
        />
        <circle
          cx="17"
          cy="15"
          r="1"
          fill="#4F46E5"
          className="animate-synapse delay-500"
        />
      </svg>
    </div>
  );
}
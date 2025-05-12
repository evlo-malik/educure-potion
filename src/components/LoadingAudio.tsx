import React from 'react';

interface LoadingAudioProps {
  className?: string;
}

export default function LoadingAudio({ className = '' }: LoadingAudioProps) {
  return (
    <div className={`${className} relative`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Outer circle with pulse effect */}
        <circle
          cx="12"
          cy="12"
          r="10"
          className="stroke-violet-600"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5 5"
          style={{ animation: 'spin 10s linear infinite' }}
        />

        {/* Audio waves */}
        <g className="transform-origin-center">
          {[0, 1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <line
                x1="8"
                y1={12 - i * 2}
                x2="8"
                y2={12 + i * 2}
                className="stroke-violet-600 animate-audio-wave"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
              <line
                x1="12"
                y1={12 - (4 - i) * 2}
                x2="12"
                y2={12 + (4 - i) * 2}
                className="stroke-violet-600 animate-audio-wave"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ animationDelay: `${(4 - i) * 0.1}s` }}
              />
              <line
                x1="16"
                y1={12 - i * 2}
                x2="16"
                y2={12 + i * 2}
                className="stroke-violet-600 animate-audio-wave"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            </React.Fragment>
          ))}
        </g>

        {/* Center speaker icon */}
        <circle
          cx="12"
          cy="12"
          r="3"
          className="fill-violet-600 animate-pulse"
        />
      </svg>
    </div>
  );
}
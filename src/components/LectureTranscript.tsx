import React, { useState, useRef } from 'react';
import { Volume2, Pause, Play } from 'lucide-react';

interface LectureTranscriptProps {
  content: string;
  documentId: string;
  audioUrl?: string;
  onTranscriptUpdate?: (newContent: string) => void;
}

export default function LectureTranscript({ content, documentId, audioUrl }: LectureTranscriptProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-sm dark:shadow-gray-900/50 z-10">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Lecture Transcript
          </h2>
          {audioUrl && (
            <button
              onClick={togglePlayback}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors group touch-target"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400 transform transition-transform group-hover:scale-110" />
              ) : (
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400 transform transition-transform group-hover:scale-110" />
              )}
            </button>
          )}
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="mb-4 sm:mb-6">
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              controls
              className="w-full touch-target"
            />
          </div>
        )}

        {/* Content */}
        <div className="relative">
          <div className="prose prose-indigo dark:prose-invert max-w-none">
            <div className="p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-800">
              <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-200 leading-relaxed text-sm sm:text-base">
                {content.split('\n').map((line, index) => {
                  // Check if the line is a timestamp (matches [MM:SS] format)
                  const isTimestamp = /^\[\d{2}:\d{2}\]$/.test(line.trim());
                  if (isTimestamp) {
                    const timeStr = line.trim().slice(1, -1); // Remove brackets
                    const [minutes, seconds] = timeStr.split(':').map(Number);
                    const timeInSeconds = minutes * 60 + seconds;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = timeInSeconds;
                            audioRef.current.play();
                            setIsPlaying(true);
                          }
                        }}
                        className="inline-block px-2 py-0.5 my-1 text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer transition-colors"
                      >
                        {line}
                      </button>
                    );
                  }
                  return (
                    <React.Fragment key={index}>
                      {line}
                      {index < content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
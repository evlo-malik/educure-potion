import React, { useState, useRef } from 'react';
import { Pencil, Trash2, Check, X, Volume2, Pause } from 'lucide-react';

interface AudioCardProps {
  audio: {
    url: string;
    style: string;
    name?: string;
    fileName?: string;
  };
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onEnd: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}

export default function AudioCard({
  audio,
  isPlaying,
  onPlay,
  onPause,
  onEnd,
  onDelete,
  onRename
}: AudioCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(audio.name || `${audio.style} Version`);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRename = () => {
    if (newName.trim() && newName !== audio.name) {
      onRename(newName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setNewName(audio.name || `${audio.style} Version`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-violet-100 dark:border-violet-900/50 shadow-sm dark:shadow-violet-900/20 overflow-hidden hover:shadow-md dark:hover:shadow-violet-900/30 transition-shadow">
      <div className="bg-violet-50 dark:bg-violet-900/30 px-4 py-2 border-b border-violet-100 dark:border-violet-900/50 flex items-center justify-between">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 px-2 py-1 text-sm rounded border border-violet-300 dark:border-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              autoFocus
            />
            <button
              onClick={handleRename}
              className="p-1 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-full transition-colors"
            >
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setNewName(audio.name || `${audio.style} Version`);
              }}
              className="p-1 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <h4 className="text-sm font-medium text-violet-900 dark:text-violet-100 flex items-center gap-2">
              {audio.name || `${audio.style} Version`}
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-full transition-colors"
              >
                <Pencil className="w-3 h-3 text-violet-600 dark:text-violet-400" />
              </button>
            </h4>
            <div className="flex items-center gap-2">
              {showDeleteConfirm ? (
                <>
                  <span className="text-xs text-red-600 dark:text-red-400">Delete?</span>
                  <button
                    onClick={onDelete}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                  >
                    <Check className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="p-1 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
            {isPlaying ? (
              <Pause className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            )}
          </div>
          <audio
            ref={audioRef}
            src={audio.url}
            controls
            className="flex-1"
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnd}
          />
        </div>
      </div>
    </div>
  );
}
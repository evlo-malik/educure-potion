import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Save, X, Pause, Play, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LectureReviewProps {
  audioUrl: string;
  transcript: string;
  onSave: (editedTranscript: string) => void;
  onCancel: () => void;
  isUploadedFile?: boolean;
}

export default function LectureReview({ audioUrl, transcript, onSave, onCancel, isUploadedFile }: LectureReviewProps) {
  const { t } = useTranslation();
  const [editedTranscript, setEditedTranscript] = useState<string[]>([]);
  const [uploadedText, setUploadedText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timestampRegex = /^\[\d{2}:\d{2}\]$/;

  useEffect(() => {
    if (isUploadedFile) {
      const text = transcript.split('\n').slice(1).join('\n');
      setUploadedText(text);
    } else {
      const segments = transcript.split('\n').map(line => ({
        text: line,
        isTimestamp: timestampRegex.test(line.trim())
      }));
      setEditedTranscript(segments.map(s => s.text));
    }
  }, [transcript, isUploadedFile]);

  const handleTranscriptChange = (index: number, newValue: string) => {
    setEditedTranscript(prev => {
      const updated = [...prev];
      if (!timestampRegex.test(prev[index].trim())) {
        updated[index] = newValue;
      }
      return updated;
    });
  };

  const handleTimestampClick = (timestamp: string) => {
    if (audioRef.current && audioUrl) {
      const [minutes, seconds] = timestamp
        .slice(1, -1)
        .split(':')
        .map(Number);
      
      const timeInSeconds = minutes * 60 + seconds;
      audioRef.current.currentTime = timeInSeconds;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (isUploadedFile) {
        const finalText = `[00:00]\n${uploadedText}`;
        await onSave(finalText);
      } else {
        const cleanedTranscript = editedTranscript
          .filter(line => line.trim() !== '')
          .join('\n');
        await onSave(cleanedTranscript);
      }
    } catch (error) {
      console.error('Error saving transcript:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 py-6 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-white/20 dark:border-gray-800/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {isUploadedFile 
                ? t('liveLecture.reviewEdit.uploadedTitle')
                : t('liveLecture.reviewEdit.title')}
            </h2>
            {audioUrl && !isUploadedFile && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      if (isPlaying) {
                        audioRef.current.pause();
                      } else {
                        audioRef.current.play();
                      }
                      setIsPlaying(!isPlaying);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  aria-label={isPlaying ? t('liveLecture.reviewEdit.audio.pause') : t('liveLecture.reviewEdit.audio.play')}
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Play className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </button>
              </div>
            )}
          </div>

          {audioUrl && !isUploadedFile && (
            <div className="mb-6">
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                controls
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-4">
            {isUploadedFile ? (
              <textarea
                value={uploadedText}
                onChange={(e) => setUploadedText(e.target.value)}
                className="w-full p-4 rounded-lg border resize-y transition-colors bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 min-h-[400px] text-gray-900 dark:text-gray-100"
                placeholder={t('liveLecture.reviewEdit.transcript.placeholder')}
              />
            ) : (
              editedTranscript.map((text, index) => {
                const isTimestamp = timestampRegex.test(text.trim());
                return (
                  <div key={index} className={`relative ${isTimestamp ? 'pointer-events-none' : ''}`}>
                    {isTimestamp ? (
                      <div
                        className={`w-auto px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-mono text-sm rounded ${
                          audioUrl ? 'hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer' : ''
                        }`}
                        onClick={() => audioUrl && handleTimestampClick(text.trim())}
                      >
                        {text}
                      </div>
                    ) : (
                      <textarea
                        value={text}
                        onChange={(e) => handleTranscriptChange(index, e.target.value)}
                        className="w-full p-3 rounded-lg border resize-none transition-colors bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-gray-900 dark:text-gray-100"
                        rows={1}
                        style={{ minHeight: '4rem' }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                <X className="h-4 w-4" />
                {t('liveLecture.reviewEdit.actions.cancel')}
              </span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('liveLecture.reviewEdit.actions.saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t('liveLecture.reviewEdit.actions.save')}
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen loading overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <p className="text-gray-700 dark:text-gray-200">{t('liveLecture.reviewEdit.savingOverlay.message')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
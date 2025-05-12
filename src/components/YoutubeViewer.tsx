import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YoutubeViewerProps {
  url: string;
  onPlayerReady?: (player: any) => void;
}

export default function YoutubeViewer({ url, onPlayerReady }: YoutubeViewerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [player, setPlayer] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Extract video ID from URL
  const getVideoId = (url: string): string => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v') || '';
      } else if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }
      return '';
    } catch {
      return '';
    }
  };

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth - 32; // Account for padding
        const height = Math.floor(width * 0.5625); // 16:9 aspect ratio
        setDimensions({ width, height });
      }
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial dimensions
    updateDimensions();

    return () => resizeObserver.disconnect();
  }, []);

  // Initialize YouTube player
  useEffect(() => {
    const videoId = getVideoId(url);
    if (!videoId) {
      setError('Invalid YouTube URL');
      setIsLoading(false);
      return;
    }

    // Load YouTube IFrame API
    const loadYouTubeAPI = () => {
      return new Promise<void>((resolve) => {
        if (window.YT && window.YT.Player) {
          resolve();
        } else {
          window.onYouTubeIframeAPIReady = () => resolve();
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }
      });
    };

    const initializePlayer = async () => {
      try {
        await loadYouTubeAPI();

        if (!playerRef.current) return;

        // Cleanup existing player
        if (player) {
          player.destroy();
        }

        const newPlayer = new window.YT.Player(playerRef.current, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin,
            enablejsapi: 1,
            playsinline: 1,
            host: 'https://www.youtube-nocookie.com',
          },
          events: {
            onReady: (event: any) => {
              setIsLoading(false);
              setPlayer(event.target);
              if (onPlayerReady) {
                onPlayerReady(event.target);
              }
            },
            onError: (e: any) => {
              console.error('YouTube Player Error:', e);
              setError('Failed to load video');
              setIsLoading(false);
            },
            onStateChange: (e: any) => {
              if (e.data === window.YT.PlayerState.PLAYING) {
                setIsLoading(false);
              }
            },
          },
        });

        setPlayer(newPlayer);
      } catch (err) {
        console.error('Error initializing YouTube player:', err);
        setError('Failed to initialize video player');
        setIsLoading(false);
      }
    };

    initializePlayer();

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [url, onPlayerReady]);

  if (!getVideoId(url)) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-900 p-4">
        <p className="text-gray-500 dark:text-gray-400 mb-2">Invalid YouTube URL</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Original URL: {url}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Open in YouTube
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-100 dark:bg-gray-900" ref={containerRef}>
      <div className="relative w-full h-full p-4">
        <div 
          className="relative mx-auto rounded-lg overflow-hidden shadow-lg bg-black"
          style={{ 
            width: dimensions.width,
            height: dimensions.height,
            maxHeight: '100%'
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/10 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          )}
          <div ref={playerRef} className="absolute inset-0" />
        </div>
      </div>
    </div>
  );
}
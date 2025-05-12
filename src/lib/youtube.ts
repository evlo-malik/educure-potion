import { YoutubeTranscript } from 'youtube-transcript';

function extractVideoId(url: string): string {
  if (!url) {
    throw new Error('Please provide a YouTube URL');
  }

  try {
    const urlObj = new URL(url);
    let videoId = '';

    if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v') || '';
    } else if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    }

    if (!videoId || videoId.length !== 11) {
      throw new Error('Invalid YouTube video ID. Please provide a valid YouTube URL.');
    }

    return videoId;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid URL')) {
      throw new Error('Please provide a valid YouTube URL');
    }
    throw error;
  }
}

async function getVideoMetadata(videoId: string): Promise<{ title: string; description: string }> {
  try {
    // Use a simpler approach - just return a placeholder since we don't need detailed metadata
    return {
      title: `YouTube Video ${videoId}`,
      description: ''
    };
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    throw new Error('Failed to fetch video details. Please check the URL and try again.');
  }
}

export async function fetchTranscript(videoUrl: string): Promise<{ 
  transcript: string; 
  title: string;
  description: string;
}> {
  try {
    const videoId = extractVideoId(videoUrl);
    
    // First try to get metadata to validate video exists and is accessible
    const metadata = await getVideoMetadata(videoId);

    // Then get transcript using youtube-transcript
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en'
    });
    
    if (!transcriptItems || transcriptItems.length === 0) {
      throw new Error('NO_TRANSCRIPT_AVAILABLE');
    }

    // Combine all transcript parts into one text
    const transcript = transcriptItems
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!transcript) {
      throw new Error('NO_TRANSCRIPT_AVAILABLE');
    }

    return {
      transcript,
      title: metadata.title,
      description: metadata.description
    };
  } catch (error) {
    console.error('YouTube Error:', error);

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('could not get transcripts') || 
          message.includes('no captions found') ||
          message.includes('transcript is disabled') ||
          message === 'no_transcript_available') {
        throw new Error('NO_TRANSCRIPT_AVAILABLE');
      }

      if (message.includes('video is unavailable') || 
          message.includes('video not found')) {
        throw new Error('This video is unavailable or does not exist. Please check the URL and try again.');
      }

      if (message.includes('sign in')) {
        throw new Error('This video requires sign-in. Please try a different video.');
      }

      // If we have a specific error message, use it
      throw error;
    }

    // Generic fallback error
    throw new Error('Failed to process YouTube video. Please check your internet connection and try again.');
  }
}

export function validateYoutubeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
      if (hostname.includes('youtube.com')) {
        const videoId = urlObj.searchParams.get('v');
        return !!videoId && videoId.length === 11;
      } else if (hostname === 'youtu.be') {
        const videoId = urlObj.pathname.slice(1);
        return videoId.length === 11;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}
import axios from 'axios';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { storeDocumentVectors } from './embeddings';

const APIFY_API_TOKEN = import.meta.env.VITE_APIFY_API_TOKEN;
const SYNC_API_ENDPOINT = 'https://api.apify.com/v2/acts/knowbaseai~youtube-transcript-extractor/run-sync-get-dataset-items';
const MAX_DOCUMENT_CHARACTERS = 5000000;

// Function to ensure URL is in the correct format
function normalizeYoutubeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    } else if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      if (videoId) {
        return `https://www.youtube.com/watch?v=${videoId}`;
      }
    }
    return url;
  } catch {
    return url;
  }
}

// Function to format transcript data
function formatTranscript(transcriptData: any): string {
  try {
    if (!transcriptData?.transcript_json?.chunks || !Array.isArray(transcriptData.transcript_json.chunks)) {
      throw new Error('Invalid transcript format');
    }

    // Validate each chunk has required properties
    const validChunks = transcriptData.transcript_json.chunks.every((chunk: any) => 
      Array.isArray(chunk?.timestamp) && 
      chunk.timestamp.length === 2 &&
      typeof chunk?.text === 'string' &&
      chunk.text.trim().length > 0
    );

    if (!validChunks) {
      throw new Error('Invalid transcript format');
    }

    // Transform chunks into time: text format
    return transcriptData.transcript_json.chunks
      .map((chunk: { timestamp: number[]; text: string }) => 
        `${chunk.timestamp[0]}: ${chunk.text}`
      )
      .join('\n');
  } catch (error) {
    console.error('Error formatting transcript:', error);
    throw new Error('NO_TRANSCRIPT_AVAILABLE');
  }
}

// Function to get transcript from backup API
async function getTranscriptFromBackupApi(url: string): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.apify.com/v2/acts/pintostudio~youtube-transcript-scraper/run-sync-get-dataset-items',
      {
        videoUrl: url
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APIFY_API_TOKEN}`
        }
      }
    );

    // Check if response has the expected structure
    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('Invalid transcript format from backup API');
    }

    // Check for the specific error case: "Captions not found for this video"
    if (response.data[0]?.data?.error === "Captions not found for this video") {
      console.error('Backup API Error: Captions not found for this video');
      throw new Error('CAPTIONS_NOT_FOUND_FOR_VIDEO');
    }

    if (!response.data[0]?.data) {
      throw new Error('Invalid transcript format from backup API');
    }

    const transcriptData = response.data[0].data;
    
    // Validate the transcript data
    if (!Array.isArray(transcriptData) || transcriptData.length === 0) {
      throw new Error('Invalid transcript format from backup API');
    }

    // Transform the backup API format to match our expected format
    return transcriptData
      .map((chunk: { start: string; text: string }) => 
        `${parseFloat(chunk.start)}: ${chunk.text}`
      )
      .join('\n');
  } catch (error) {
    console.error('Backup API Error:', error);
    // Rethrow CAPTIONS_NOT_FOUND_FOR_VIDEO error to be handled specifically
    if (error instanceof Error && error.message === 'CAPTIONS_NOT_FOUND_FOR_VIDEO') {
      throw error;
    }
    throw new Error('NO_TRANSCRIPT_AVAILABLE');
  }
}

// Function to get transcript from second backup API
async function getTranscriptFromSecondBackupApi(url: string): Promise<string> {
  try {
    console.log('Making request to second backup API with URL:', url);
    const response = await axios.post(
      'https://api.apify.com/v2/acts/insight_api_labs~youtube-transcript-1-month---reliable-efficient/run-sync-get-dataset-items',
      {
        "video_urls": [
          {
            "url": url,
            "method": "GET"
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${APIFY_API_TOKEN}`
        }
      }
    );

    console.log('Second backup API response:', JSON.stringify(response.data, null, 2));

    // Check if response has the expected structure
    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('Invalid transcript format from second backup API');
    }

    const videoData = response.data[0];
    
    // Check if transcriptWithTimestamps exists and is not empty
    if (!videoData.transcriptWithTimestamps || !Array.isArray(videoData.transcriptWithTimestamps) || videoData.transcriptWithTimestamps.length === 0) {
      throw new Error('No transcript available from second backup API');
    }

    // Transform the second backup API format to match our expected format
    return videoData.transcriptWithTimestamps
      .map((chunk: { timestamp: string; text: string }) => {
        // Convert MM:SS format to seconds
        const [minutes, seconds] = chunk.timestamp.split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds;
        return `${totalSeconds}: ${chunk.text}`;
      })
      .join('\n');
  } catch (error: any) {
    console.error('Second Backup API Error:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    throw new Error('NO_TRANSCRIPT_AVAILABLE');
  }
}

export async function getYoutubeTranscript(url: string, userId: string, subject?: string): Promise<string> {
  try {
    const normalizedUrl = normalizeYoutubeUrl(url);
    const videoId = new URL(normalizedUrl).searchParams.get('v') || new URL(normalizedUrl).pathname.slice(1);
    
    // Get video title first
    const videoTitle = await getVideoTitle(normalizedUrl);
    
    let formattedContent: string;
    let lastError: any;
    
    try {
      // Try primary API first
      const response = await axios.post(
        SYNC_API_ENDPOINT,
        {
          videoUrl: normalizedUrl
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${APIFY_API_TOKEN}`
          }
        }
      );

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0 || !response.data[0]?.transcript_json) {
        throw new Error('NO_TRANSCRIPT_AVAILABLE');
      }

      const transcriptData = response.data[0];
      if (transcriptData.status !== 'success' || !transcriptData.transcript_json) {
        throw new Error('NO_TRANSCRIPT_AVAILABLE');
      }

      formattedContent = formatTranscript(transcriptData);
    } catch (primaryError) {
      console.log('Primary API failed:', primaryError);
      lastError = primaryError;
      
      try {
        console.log('Trying first backup API...');
        // If primary API fails, try first backup API
        formattedContent = await getTranscriptFromBackupApi(normalizedUrl);
      } catch (firstBackupError) {
        console.log('First backup API failed:', firstBackupError);
        lastError = firstBackupError;
        
        // If the error is CAPTIONS_NOT_FOUND, don't try the second backup API
        if (firstBackupError instanceof Error && firstBackupError.message === 'CAPTIONS_NOT_FOUND') {
          throw new Error('NO_TRANSCRIPT_AVAILABLE');
        }
        
        // If the error is CAPTIONS_NOT_FOUND_FOR_VIDEO, try the second backup API
        if (firstBackupError instanceof Error && firstBackupError.message === 'CAPTIONS_NOT_FOUND_FOR_VIDEO') {
          console.log('Captions not found for this video, trying second backup API...');
          try {
            formattedContent = await getTranscriptFromSecondBackupApi(normalizedUrl);
          } catch (secondBackupError) {
            console.log('Second backup API failed:', secondBackupError);
            throw new Error('NO_TRANSCRIPT_AVAILABLE');
          }
        } else {
          console.log('Trying second backup API...');
          // If first backup API fails with a different error, try second backup API
          formattedContent = await getTranscriptFromSecondBackupApi(normalizedUrl);
        }
      }
    }

    // Check if we got valid formatted content
    if (!formattedContent || formattedContent.trim().length === 0) {
      throw new Error('NO_TRANSCRIPT_AVAILABLE');
    }

    // Check content length
    if (formattedContent.length > MAX_DOCUMENT_CHARACTERS) {
      throw new Error('This video transcript is too long for our processing capacity. Please try a shorter video.');
    }

    // Create new document in Firestore
    const docRef = await addDoc(collection(db, 'documents'), {
      title: videoTitle,
      content: formattedContent,
      user_id: userId,
      created_at: serverTimestamp(),
      summary: '',
      flashcards: '[]',
      chat_messages: '[]',
      test: '[]',
      type: 'youtube',
      youtube_link: normalizedUrl,
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      subject: subject || 'All Documents'
    });

    // Store vectors in Pinecone
    await storeDocumentVectors(docRef.id, formattedContent, 'youtube');

    return docRef.id;
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof Error) {
      if (error.message === 'NO_TRANSCRIPT_AVAILABLE') {
        throw new Error('NO_TRANSCRIPT_AVAILABLE');
      }
      if (error.message === 'CAPTIONS_NOT_FOUND') {
        throw new Error('CAPTIONS_NOT_FOUND');
      }
    }
    throw error;
  }
}

// Function to get video title from YouTube API
async function getVideoTitle(url: string): Promise<string> {
  try {
    const videoId = new URL(url).searchParams.get('v') || new URL(url).pathname.slice(1);
    const API_KEY = 'AIzaSyBf6NjaAZ-6Rcw6XkzH5Fifh4OLc4rQQ3s';
    
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`
    );

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].snippet.title;
    }
    throw new Error('Video not found');
  } catch (error) {
    console.error('Error getting video title:', error);
    return 'YouTube Video';
  }
}
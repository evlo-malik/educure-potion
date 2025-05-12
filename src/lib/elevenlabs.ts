import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { updateDocument } from './firestore';
import { generateStyledText } from './gemini';
import { getFunctions, httpsCallable } from 'firebase/functions';

const VOICEMAKER_API_KEY = import.meta.env.VITE_VOICEMAKER_API_KEY;
const API_URL = import.meta.env.VITE_VOICEMAKER_API_URL;

// Voice IDs for different styles
const VOICE_IDS = {
  Lecture: 'ai3-en-US-Alexander', // Professional male voice
  ASMR: 'proplus-Lexi', // Soft female voice
  Motivational: 'pro1-Thomas', // Energetic male voice
  Storytelling: 'pro1-Jacky', // Expressive female voice
  Soft: 'ai3-Jenny', // Soft female voice
  News: 'ai3-Jony' // Professional news voice
};

// Voice effects for specific styles
const VOICE_EFFECTS = {
  Lecture: 'default',
  News: 'news',
  Soft: 'whispered',
  ASMR: 'whispered',
  Motivational: 'default',
  Storytelling: 'default',
  default: 'default'
};

// Replicate voice mapping for non-pro voices
const REPLICATE_VOICE_IDS = {
  Lecture: 'af_bella', // Professional male voice
  News: 'am_fenrir', // Professional news voice
  Soft: 'af_nicole', // Soft female voice
  ASMR: 'af_nicole', // Not used for pro voices, but added for type safety
  Motivational: 'am_michael', // Not used for pro voices, but added for type safety
  Storytelling: 'bf_emma' // Not used for pro voices, but added for type safety
};

// Language code mapping for PRO voices (ASMR, Motivational, Storytelling)
const LANGUAGE_CODES = {
  'Afrikaans': 'af-ZA',
  'Albanian': 'sq-AL',
  'Arabic': 'ar-SA', // Using Saudi Arabia as default
  'Armenian': 'hy-AM',
  'Azerbaijani': 'az-AZ',
  'Bahasa Indonesian': 'id-ID',
  'Bengali': 'bn-IN', // Using India as default
  'Bosnian': 'bs-BA',
  'Bulgarian': 'bg-BG',
  'Catalan': 'ca-ES',
  'Chinese Cantonese': 'zh-HK',
  'Chinese Mandarin': 'cmn-CN',
  'Croatian': 'hr-HR',
  'Czech': 'cs-CZ',
  'Danish': 'da-DK',
  'Dutch': 'nl-NL',
  'English': 'en-US',
  'Estonian': 'et-EE',
  'Filipino': 'fil-PH',
  'Finnish': 'fi-FI',
  'French': 'fr-FR',
  'Galician': 'gl-ES',
  'Georgian': 'ka-GE',
  'German': 'de-DE',
  'Greek': 'el-GR',
  'Hebrew': 'he-IL',
  'Hindi': 'hi-IN',
  'Hungarian': 'hu-HU',
  'Icelandic': 'is-IS',
  'Irish': 'ga-IE',
  'Italian': 'it-IT',
  'Japanese': 'ja-JP',
  'Javanese': 'jv-ID',
  'Kannada': 'kn-IN',
  'Kazakh': 'kk-KZ',
  'Korean': 'ko-KR',
  'Latvian': 'lv-LV',
  'Lithuanian': 'lt-LT',
  'Macedonian': 'mk-MK',
  'Malay': 'ms-MY',
  'Maltese': 'mt-MT',
  'Marathi': 'mr-IN',
  'Mongolian': 'mn-MN',
  'Nepali': 'ne-NP',
  'Norwegian Bokmål': 'nb-NO',
  'Pashto': 'ps-AF',
  'Persian': 'fa-IR',
  'Polish': 'pl-PL',
  'Portuguese': 'pt-PT',
  'Romanian': 'ro-RO',
  'Russian': 'ru-RU',
  'Serbian': 'sr-RS',
  'Sinhala': 'si-LK',
  'Slovak': 'sk-SK',
  'Slovene': 'sl-SI',
  'Somali': 'so-SO',
  'Spanish': 'es-ES',
  'Swahili': 'sw-KE', // Using Kenya as default
  'Swedish': 'sv-SE',
  'Tamil': 'ta-IN', // Using India as default
  'Telugu': 'te-IN',
  'Thai': 'th-TH',
  'Turkish': 'tr-TR',
  'Ukrainian': 'uk-UA',
  'Urdu': 'ur-PK', // Using Pakistan as default
  'Uzbek': 'uz-UZ',
  'Vietnamese': 'vi-VN',
  'Welsh': 'cy-GB',
  'Zulu': 'zu-ZA'
};

export type AudioStyle = keyof typeof VOICE_IDS;

// Helper function to determine if a voice is a pro voice
function isProVoice(style: AudioStyle): boolean {
  return style === 'ASMR' || style === 'Motivational' || style === 'Storytelling';
}

/**
 * Generates speech audio from text using either VoiceMaker API (for pro voices) or Replicate API (for standard voices).
 * 
 * IMPORTANT: This function does NOT increment usage counts. The caller is responsible for
 * incrementing usage only after confirming successful generation. This ensures users are not
 * charged for failed generations.
 */
export async function generateSpeech(text: string, style: AudioStyle, documentId: string, userId: string, selectedLanguage: string = 'English'): Promise<string> {
  try {
    if (!text) {
      throw new Error('No text provided for speech generation');
    }

    // For pro voices, use the existing VoiceMaker API
    if (isProVoice(style)) {
      return await generateVoiceMakerSpeech(text, style, documentId, userId, selectedLanguage);
    } 
    // For non-pro voices, use Replicate API via Firebase function
    else {
      // First, generate styled text using Gemini
      const styledText = await generateStyledText(text, style, selectedLanguage);
      
      // Determine the appropriate Replicate voice based on style
      const voice = REPLICATE_VOICE_IDS[style] || 'en_male';
      
      // Use the HTTP function instead of the callable function
      try {
        const response = await axios.post(
          'https://us-central1-educure-ai.cloudfunctions.net/generateReplicateSpeechHttp',
          {
            text: styledText,
            voice: voice,
            userId: userId,
            documentId: documentId
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Check if there's an error in the response
        if (response.data.error) {
          console.error('Function returned error:', response.data.error);
          throw new Error(`Speech generation failed: ${response.data.error}`);
        }
        
        // Get the audio URL from the response
        const audioUrl = response.data.audioUrl;
        
        if (!audioUrl) {
          throw new Error('Failed to generate audio: No URL returned');
        }
        
        // Check if we got a direct Replicate URL (temporary)
        if (response.data.note && response.data.note.includes('direct Replicate URL')) {
          console.log('Received temporary Replicate URL, downloading and storing in Firebase Storage');
          
          try {
            // Download the audio file
            const audioResponse = await axios.get(audioUrl, {
              responseType: 'blob'
            });
            
            // Create a file name with the style and timestamp
            const timestamp = Date.now();
            const fileName = `${style.toLowerCase()}_${timestamp}.mp3`;
            
            // Create a reference to the audio file in Firebase Storage
            const audioRef = ref(storage, `audio/${userId}/${documentId}/${fileName}`);
            
            // Upload the audio file
            await uploadBytes(audioRef, audioResponse.data, {
              contentType: 'audio/mpeg',
              cacheControl: 'public,max-age=31536000',
            });
            
            // Get the download URL
            const permanentUrl = await getDownloadURL(audioRef);
            
            // Update the document with the permanent audio URL and style
            await updateDocument(documentId, {
              audioUrl: permanentUrl,
              audioStyle: style,
            });
            
            return permanentUrl;
          } catch (storageError) {
            console.error('Error storing audio in Firebase Storage:', storageError);
            // If client-side storage fails, still use the temporary URL
            // but warn the user that it might expire
            
            // Update the document with the temporary audio URL and style
            await updateDocument(documentId, {
              audioUrl,
              audioStyle: style,
            });
            
            return audioUrl;
          }
        }
        
        // Update the document with the audio URL and style
        await updateDocument(documentId, {
          audioUrl,
          audioStyle: style,
        });
        
        return audioUrl;
      } catch (error) {
        console.error('HTTP Function Error:', error);
        
        // Try to extract more detailed error information
        if (axios.isAxiosError(error) && error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
          
          // If there's a permission error, provide a more helpful message
          if (error.response.data?.error?.includes('Permission') || 
              error.response.status === 403) {
            throw new Error('Permission error: The function lacks necessary permissions. Please contact support.');
          }
        }
        
        throw error;
      }
    }
  } catch (error) {
    console.error('Speech Generation Error:', error);
    throw error;
  }
}

// Original VoiceMaker implementation moved to a separate function
async function generateVoiceMakerSpeech(text: string, style: AudioStyle, documentId: string, userId: string, selectedLanguage: string = 'English'): Promise<string> {
  try {
    // Get the language code for PRO voices, otherwise use English
    const languageCode = (style === 'ASMR' || style === 'Motivational' || style === 'Storytelling') 
      ? (LANGUAGE_CODES as { [key: string]: string })[selectedLanguage] || 'en-US'
      : 'en-US';

    // Prepare the request payload
    const payload = {
      Engine: 'neural',
      VoiceId: VOICE_IDS[style],
      LanguageCode: languageCode,
      Text: text,
      OutputFormat: 'mp3',
      SampleRate: '48000',
      ...(style === 'ASMR' && { ProEngine: 'turbo' }),
      Effect: VOICE_EFFECTS[style] || VOICE_EFFECTS.default,
      MasterVolume: '0',
      MasterSpeed: style === 'ASMR' ? '-10' : '0',
      MasterPitch: '0'
    };

    // Make the API request
    console.log('Making VoiceMaker API request with payload:', {
      ...payload,
      Text: payload.Text.substring(0, 100) + '...' // Truncate text for logging
    });

    const response = await axios.post(API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${VOICEMAKER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer',
      validateStatus: (status) => true, // Accept all status codes to handle errors
    });

    console.log('VoiceMaker API response status:', response.status);
    console.log('VoiceMaker API response headers:', response.headers);
    console.log('VoiceMaker API response size:', response.data?.byteLength || 0, 'bytes');

    // Try to parse as JSON first (in case of error response)
    try {
      const textData = new TextDecoder().decode(response.data);
      const jsonData = JSON.parse(textData);
      console.log('Response parsed as JSON:', jsonData);
      
      // If we got a JSON response, it's likely an error
      if (jsonData.error || jsonData.message || !jsonData.success) {
        throw new Error(`API Error: ${jsonData.error || jsonData.message || 'Unknown error'}`);
      }

      // If we got a JSON response with a path to the audio file
      if (jsonData.path) {
        console.log('Received audio file path:', jsonData.path);
        
        // Function to create a blob from array buffer
        const createAudioBlob = (data: ArrayBuffer) => {
          return new Blob([data], { type: 'audio/mpeg' });
        };

        // Try different methods to fetch the audio
        const fetchMethods = [
          // Method 1: Direct fetch with minimal headers
          async () => {
            console.log('Attempting direct fetch...');
            const response = await axios.get(jsonData.path, {
              responseType: 'arraybuffer',
              headers: {
                'Accept': 'audio/mpeg',
              },
            });
            return response.data;
          },
          
          // Method 2: Using a backend proxy (if available)
          async () => {
            console.log('Attempting through backend proxy...');
            const proxyUrl = '/api/proxy-audio'; // Your backend proxy endpoint
            const response = await axios.post(proxyUrl, {
              url: jsonData.path,
              apiKey: VOICEMAKER_API_KEY
            }, {
              responseType: 'arraybuffer'
            });
            return response.data;
          },

          // Method 3: Using public CORS proxies
          async () => {
            console.log('Attempting through public CORS proxies...');
            const proxyUrls = [
              `https://api.allorigins.win/raw?url=${encodeURIComponent(jsonData.path)}`,
              `https://corsproxy.io/?${encodeURIComponent(jsonData.path)}`,
              `https://cors.bridged.cc/${jsonData.path}`
            ];

            for (const proxyUrl of proxyUrls) {
              try {
                const response = await axios.get(proxyUrl, {
                  responseType: 'arraybuffer',
                  timeout: 10000
                });
                if (response.data && response.data.byteLength > 0) {
                  return response.data;
                }
              } catch (error) {
                console.log(`Proxy ${proxyUrl} failed:`, error);
                continue;
              }
            }
            throw new Error('All proxy attempts failed');
          }
        ];

        // Try each method in sequence
        let lastError: Error | null = null;
        for (const method of fetchMethods) {
          try {
            const audioData = await method();
            if (audioData && audioData.byteLength > 0) {
              response.data = audioData;
              response.headers['content-type'] = 'audio/mpeg';
              break;
            }
          } catch (error) {
            console.log('Fetch method failed:', error);
            lastError = error instanceof Error ? error : new Error(String(error));
            continue;
          }
        }

        // If all methods failed, throw the last error
        if (!response.data || response.data.byteLength === 0) {
          throw new Error(`Failed to fetch audio: ${lastError?.message || 'Unknown error'}`);
        }
      } else {
        throw new Error('No audio file path received from API');
      }
    } catch (e) {
      // If parsing as JSON fails, assume it's binary audio data
      console.log('Response is not JSON, treating as binary audio data');
      if (e instanceof Error) {
        console.log('Error details:', e.message);
      }
    }

    // Check if we got a valid audio response
    if (!response.data || response.data.byteLength === 0) {
      throw new Error('Failed to generate audio: Empty response');
    }

    // Create audio blob
    const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });

    // Validate the blob
    if (audioBlob.size === 0) {
      throw new Error('Failed to generate audio: Generated audio file is empty');
    }

    // Create a reference to the audio file in Firebase Storage
    const audioRef = ref(storage, `audio/${userId}/${documentId}/${style.toLowerCase()}_${Date.now()}.mp3`);

    // Upload the audio file
    await uploadBytes(audioRef, audioBlob, {
      contentType: 'audio/mpeg',
      cacheControl: 'public,max-age=31536000',
    });

    // Get the download URL
    const audioUrl = await getDownloadURL(audioRef);

    // Update the document with the audio URL and style
    await updateDocument(documentId, {
      audioUrl,
      audioStyle: style,
    });

    return audioUrl;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('VoiceMaker API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });

      if (error.response?.status === 401) {
        throw new Error('Invalid API key or authentication failed');
      } else if (error.response?.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 400) {
        throw new Error(`API Error: Invalid request - ${error.response.data?.message || 'Please check language and voice compatibility'}`);
      }
      throw new Error(`API Error: ${error.response?.data?.message || 'Failed to generate speech'} (Status: ${error.response?.status})`);
    }
    console.error('Speech Generation Error:', error);
    throw error;
  }
}
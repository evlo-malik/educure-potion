import { ref, listAll, getDownloadURL, deleteObject, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';
import type { AudioEntry } from './firestore';

export const MAX_AUDIOS_PER_DOCUMENT = 4;

export async function fetchDocumentAudios(userId: string, documentId: string): Promise<AudioEntry[]> {
  try {
    const audioRef = ref(storage, `audio/${userId}/${documentId}`);
    const result = await listAll(audioRef);
    
    const audios: AudioEntry[] = await Promise.all(
      result.items.map(async (item) => {
        const url = await getDownloadURL(item);
        // Extract style and name from filename (e.g., "lecture_1234567890_Custom Name.mp3")
        const [style, timestamp, ...nameParts] = item.name.split('_');
        const customName = nameParts.join('_').replace('.mp3', '');
        const capitalizedStyle = style.charAt(0).toUpperCase() + style.slice(1) as AudioEntry['style'];
        
        return {
          url,
          style: capitalizedStyle,
          name: customName || `${capitalizedStyle} Version`,
          createdAt: new Date(parseInt(timestamp)).toISOString(),
          fileName: item.name
        };
      })
    );

    // Sort by creation date, newest first
    return audios.sort((a, b) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
    );
  } catch (error) {
    console.error('Error fetching document audios:', error);
    return [];
  }
}

export async function deleteAudio(userId: string, documentId: string, fileName: string): Promise<boolean> {
  try {
    const audioRef = ref(storage, `audio/${userId}/${documentId}/${fileName}`);
    await deleteObject(audioRef);
    return true;
  } catch (error) {
    console.error('Error deleting audio:', error);
    return false;
  }
}

export async function renameAudio(
  userId: string, 
  documentId: string, 
  oldFileName: string, 
  newName: string
): Promise<boolean> {
  try {
    // Get the old file reference
    const oldRef = ref(storage, `audio/${userId}/${documentId}/${oldFileName}`);
    
    // Create new filename with updated name
    const [style, timestamp] = oldFileName.split('_');
    const newFileName = `${style}_${timestamp}_${newName}.mp3`;
    const newRef = ref(storage, `audio/${userId}/${documentId}/${newFileName}`);
    
    // Download the old file
    const url = await getDownloadURL(oldRef);
    const response = await fetch(url);
    const blob = await response.blob();
    
    // Upload with new name
    await uploadBytes(newRef, blob);
    
    // Delete old file
    await deleteObject(oldRef);
    
    return true;
  } catch (error) {
    console.error('Error renaming audio:', error);
    return false;
  }
}
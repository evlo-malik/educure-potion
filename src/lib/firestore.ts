import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  enableIndexedDbPersistence,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  browserLocalPersistence,
  setPersistence,
  signInWithPopup,
  GoogleAuthProvider,
  type UserCredential
} from 'firebase/auth';
import { db, storage, auth, googleProvider } from './firebase';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { storeDocumentVectors, deleteDocumentVectors } from './embeddings';
import { sendEmailVerification } from 'firebase/auth';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const flashcardSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const MAX_DOCUMENT_CHARACTERS = 500000;

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export interface FlashCard {
  question: string;
  answer: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TestQuestion {
  type: 'multiple_choice' | 'true_false';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

// Update AudioStyle type to include all voice styles
export type ExtendedAudioStyle = 'Lecture' | 'News' | 'Soft' | 'ASMR' | 'Motivational' | 'Storytelling';

export interface AudioEntry {
  url: string;
  style: ExtendedAudioStyle;
  name?: string;
  fileName?: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  summary: string;
  notes: string;
  flashcards: FlashCard[];
  chatHistory: ChatMessage[];
  test: TestQuestion[];
  testSets: { questions: TestQuestion[]; createdAt: string; instructions?: string }[];
  userId: string;
  createdAt: string;
  fileUrl?: string;
  type?: 'pdf' | 'youtube' | 'lecture';
  youtube_link?: string;
  audioUrl?: string;
  audioStyle?: ExtendedAudioStyle;
  additionalAudios?: AudioEntry[];
  thumbnail_url?: string;
  subject?: string;
}

export type UserData = z.infer<typeof userSchema>;

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn("The current browser doesn't support persistence.");
  }
});

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

function validateDocumentLength(content: string): { valid: boolean; error?: string } {
  if (content.length > MAX_DOCUMENT_CHARACTERS) {
    return {
      valid: false,
      error: 'This document exceeds our processing capacity. Please try a shorter document or split it into multiple parts.'
    };
  }
  return { valid: true };
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

export async function createUser(userData: UserData) {
  try {
    const validatedData = userSchema.parse(userData);

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      validatedData.email,
      validatedData.password
    );

    // Send verification email
    await sendEmailVerification(userCredential.user);

    await addDoc(collection(db, 'users'), {
      uid: userCredential.user.uid,
      email: validatedData.email,
      name: validatedData.name,
      created_at: serverTimestamp(),
      email_verified: false
    });

    return { success: true, userId: userCredential.user.uid, requiresVerification: true };
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid user data provided' };
    }
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create user' };
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential) {
      throw new Error('Failed to get Google credential');
    }

    // Check if user exists in our database
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', result.user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Create new user document if doesn't exist
      await addDoc(collection(db, 'users'), {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        created_at: serverTimestamp(),
      });
    }

    return {
      success: true,
      user: {
        id: result.user.uid,
        email: result.user.email,
        name: result.user.displayName
      }
    };
  } catch (error) {
    console.error('Google sign in error:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to sign in with Google' };
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', userCredential.user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'User data not found' };
    }

    const userData = querySnapshot.docs[0].data();

    return {
      success: true,
      user: {
        id: userCredential.user.uid,
        email: userData.email,
        name: userData.name,
      },
    };
  } catch (error) {
    console.error('Error logging in:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to login' };
  }
}

export async function saveDocument(
  document: Omit<Document, 'id' | 'createdAt'>,
  file?: File
) {
  try {
    // Validate document length
    const validation = validateDocumentLength(document.content);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const docRef = await addDoc(collection(db, 'documents'), {
      title: document.title,
      content: document.content || '',
      summary: document.summary || '',
      notes: document.notes || '',
      flashcards: document.flashcards?.length
        ? JSON.stringify(document.flashcards)
        : '[]',
      chat_messages: document.chatHistory?.length
        ? JSON.stringify(document.chatHistory)
        : '[]',
      test: document.test?.length ? JSON.stringify(document.test) : '[]',
      test_sets: document.testSets?.length ? JSON.stringify(document.testSets) : '[]',
      user_id: document.userId,
      created_at: serverTimestamp(),
      type: document.type || 'pdf',
      youtube_link: document.youtube_link || '',
      audio_url: document.audioUrl || '',
      thumbnail_url: document.thumbnail_url || '',
      subject: document.subject || 'All Documents',
    });

    if (file) {
      try {
        const fileRef = ref(
          storage,
          `documents/${document.userId}/${docRef.id}/${file.name}`
        );

        await retryOperation(async () => {
          const metadata = {
            contentType: file.type,
            cacheControl: 'public,max-age=31536000',
          };

          await uploadBytes(fileRef, file, metadata);
          const fileUrl = await getDownloadURL(fileRef);

          await updateDoc(docRef, {
            file_url: fileUrl,
          });
        });
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        await deleteDoc(docRef);
        throw uploadError;
      }
    }

    // Store document vectors
    if (document.content) {
      await storeDocumentVectors(docRef.id, document.content, document.type || 'pdf');
    }

    return {
      success: true,
      documentId: docRef.id,
    };
  } catch (error) {
    console.error('Error saving document:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to save document' };
  }
}

export async function getUserDocuments(userId: string): Promise<Document[]> {
  if (!userId) {
    console.error('No user ID provided to getUserDocuments');
    throw new Error('User ID is required');
  }

  try {
    const documentsRef = collection(db, 'documents');
    const q = query(documentsRef, where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content || '',
        summary: data.summary || '',
        notes: data.notes || '',
        flashcards: JSON.parse(data.flashcards || '[]'),
        chatHistory: JSON.parse(data.chat_messages || '[]'),
        test: JSON.parse(data.test || '[]'),
        testSets: JSON.parse(data.test_sets || '[]'),
        userId: data.user_id,
        createdAt: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        fileUrl: data.file_url,
        type: data.type,
        youtube_link: data.youtube_link,
        audioUrl: data.audio_url,
        audioStyle: data.audio_style,
        additionalAudios: data.additional_audios || [],
        thumbnail_url: data.thumbnail_url,
        subject: data.subject || 'All Documents'
      };
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

export async function deleteDocument(documentId: string) {
  try {
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const userId = data.user_id;

      console.log('Starting document deletion process...');

      // Delete vectors from Pinecone first
      console.log('Deleting vectors from Pinecone...');
      const vectorsDeleted = await deleteDocumentVectors(documentId);
      if (!vectorsDeleted) {
        console.warn('Failed to delete vectors from Pinecone');
      }

      // Delete all associated files from storage
      console.log('Deleting files from storage...');
      await deleteAllStorageFiles(userId, documentId, data.type);

      // Delete the document from Firestore last
      console.log('Deleting document from Firestore...');
      await deleteDoc(docRef);

      console.log('Document deletion completed successfully');
      return { success: true };
    } else {
      throw new Error('Document not found');
    }
  } catch (error) {
    console.error('Error deleting document:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete document' };
  }
}

export async function updateDocument(
  documentId: string,
  fields: Partial<Omit<Document, 'id' | 'createdAt' | 'userId'>>
) {
  try {
    const updateFields: Record<string, any> = {};

    if (fields.flashcards) {
      updateFields.flashcards = JSON.stringify(fields.flashcards);
    }

    if (fields.chatHistory) {
      fields.chatHistory.forEach((msg) => chatMessageSchema.parse(msg));
      updateFields.chat_messages = JSON.stringify(fields.chatHistory);
    }

    if (fields.test) {
      updateFields.test = JSON.stringify(fields.test);
    }

    if (fields.testSets !== undefined) {
      updateFields.test_sets = JSON.stringify(fields.testSets);
    }

    if (fields.summary !== undefined) {
      updateFields.summary = fields.summary;
    }

    if (fields.notes !== undefined) {
      updateFields.notes = fields.notes;
    }

    if (fields.content !== undefined) {
      updateFields.content = fields.content;
    }

    if (fields.title !== undefined) {
      updateFields.title = fields.title;
    }

    // Add support for audioUrl and audioStyle fields
    if (fields.audioUrl !== undefined) {
      updateFields.audio_url = fields.audioUrl;
    }

    if (fields.audioStyle !== undefined) {
      updateFields.audio_style = fields.audioStyle;
    }

    if (fields.additionalAudios !== undefined) {
      updateFields.additional_audios = fields.additionalAudios;
    }

    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, updateFields);

    return { success: true };
  } catch (error) {
    console.error('Error updating document:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update document' };
  }
}

export async function updateDocumentTitle(documentId: string, newTitle: string) {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      title: newTitle,
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating document title:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update document title' };
  }
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Delete all user's documents
    const documentsRef = collection(db, 'documents');
    const q = query(documentsRef, where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);
    
    for (const doc of querySnapshot.docs) {
      await deleteDocument(doc.id); // This will also delete associated files and vectors
    }

    // 2. Delete user's message usage data
    try {
      await deleteDoc(doc(db, 'messageUsage', userId));
      await deleteDoc(doc(db, 'purchasedMessages', userId));
    } catch (error) {
      console.warn('Error deleting message usage:', error);
    }

    // 3. Delete user's upload usage data
    try {
      await deleteDoc(doc(db, 'uploadUsage', userId));
    } catch (error) {
      console.warn('Error deleting upload usage:', error);
    }

    // 4. Delete user's vocalize usage data
    try {
      await deleteDoc(doc(db, 'vocalizeUsage', userId));
    } catch (error) {
      console.warn('Error deleting vocalize usage:', error);
    }

    // 5. Delete user's subscription data
    try {
      const customerRef = doc(db, 'customers', userId);
      const subsRef = collection(customerRef, 'subscriptions');
      const sessionsRef = collection(customerRef, 'checkout_sessions');
      const paymentsRef = collection(customerRef, 'payments');
      
      const [subsSnapshot, sessionsSnapshot, paymentsSnapshot] = await Promise.all([
        getDocs(subsRef),
        getDocs(sessionsRef),
        getDocs(paymentsRef)
      ]);
      
      // Delete all subcollection documents
      await Promise.all([
        ...subsSnapshot.docs.map(doc => deleteDoc(doc.ref)),
        ...sessionsSnapshot.docs.map(doc => deleteDoc(doc.ref)),
        ...paymentsSnapshot.docs.map(doc => deleteDoc(doc.ref))
      ]);
      
      await deleteDoc(customerRef);
    } catch (error) {
      console.warn('Error deleting subscription data:', error);
    }

    // 6. Delete user's feedback and feature requests
    try {
      const feedbackQuery = query(collection(db, 'feedback'), where('userId', '==', userId));
      const featureRequestsQuery = query(collection(db, 'feature_requests'), where('userId', '==', userId));
      
      const [feedbackDocs, featureRequestDocs] = await Promise.all([
        getDocs(feedbackQuery),
        getDocs(featureRequestsQuery)
      ]);

      await Promise.all([
        ...feedbackDocs.docs.map(doc => deleteDoc(doc.ref)),
        ...featureRequestDocs.docs.map(doc => deleteDoc(doc.ref))
      ]);
    } catch (error) {
      console.warn('Error deleting feedback:', error);
    }

    // 7. Delete user document
    try {
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('uid', '==', userId));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        await deleteDoc(userSnapshot.docs[0].ref);
      }
    } catch (error) {
      console.warn('Error deleting user document:', error);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete account' 
    };
  }
}

async function deleteAllStorageFiles(userId: string, documentId: string, documentType?: string) {
  try {
    // Delete main document files (PDFs, etc.)
    const mainFileRef = ref(storage, `documents/${userId}/${documentId}`);
    try {
      const mainFiles = await listAll(mainFileRef);
      await Promise.all(mainFiles.items.map(itemRef => deleteObject(itemRef)));
    } catch (error) {
      console.log('No main document files found');
    }

    // Delete vocalize audio files
    const audioRef = ref(storage, `audio/${userId}/${documentId}`);
    try {
      const audioFiles = await listAll(audioRef);
      await Promise.all(audioFiles.items.map(itemRef => deleteObject(itemRef)));
    } catch (error) {
      console.log('No vocalize audio files found');
    }

    // Delete lecture recording audio file
    if (documentType === 'lecture') {
      try {
        const lectureAudioRef = ref(storage, `audio/${userId}`);
        const files = await listAll(lectureAudioRef);
        const deletePromises = files.items
          .filter(item => item.name.includes('lecture.wav'))
          .map(async (item) => {
            try {
              const url = await getDownloadURL(item);
              const docRef = doc(db, 'documents', documentId);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists() && docSnap.data().audio_url === url) {
                await deleteObject(item);
              }
            } catch (error) {
              console.error('Error checking lecture audio file:', error);
            }
          });
        
        await Promise.all(deletePromises);
      } catch (error) {
        console.log('No lecture recording found:', error);
      }
    }

    // Delete any other associated files
    const otherFilesRef = ref(storage, `files/${userId}/${documentId}`);
    try {
      const otherFiles = await listAll(otherFilesRef);
      await Promise.all(otherFiles.items.map(itemRef => deleteObject(itemRef)));
    } catch (error) {
      console.log('No other files found');
    }

    return true;
  } catch (error) {
    console.error('Error deleting storage files:', error);
    return false;
  }
}

export async function getUserSubjects(userId: string) {
  try {
    const subjectsRef = collection(db, 'subjects');
    const q = query(subjectsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data().name);
  } catch (error) {
    console.error('Error getting subjects:', error);
    return [];
  }
}

export async function addSubject(userId: string, subjectName: string) {
  try {
    await addDoc(collection(db, 'subjects'), {
      userId,
      name: subjectName,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error adding subject:', error);
    return { success: false, error: 'Failed to add subject' };
  }
}

export async function updateDocumentSubject(documentId: string, subject: string) {
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      subject: subject
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating document subject:', error);
    return { success: false, error: 'Failed to update document subject' };
  }
}

export async function deleteSubject(userId: string, subjectName: string) {
  try {
    // First, update all documents in this subject to be unassigned
    const documentsRef = collection(db, 'documents');
    const q = query(documentsRef, 
      where('user_id', '==', userId),
      where('subject', '==', subjectName)
    );
    const querySnapshot = await getDocs(q);
    
    // Update all documents to be unassigned
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { subject: 'All Documents' })
    );
    await Promise.all(updatePromises);

    // Then delete the subject
    const subjectsRef = collection(db, 'subjects');
    const subjectQuery = query(subjectsRef, 
      where('userId', '==', userId),
      where('name', '==', subjectName)
    );
    const subjectSnapshot = await getDocs(subjectQuery);
    
    if (!subjectSnapshot.empty) {
      await deleteDoc(subjectSnapshot.docs[0].ref);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting subject:', error);
    return { success: false, error: 'Failed to delete subject' };
  }
}

export async function renameSubject(userId: string, oldName: string, newName: string) {
  try {
    // Update the subject name
    const subjectsRef = collection(db, 'subjects');
    const subjectQuery = query(subjectsRef, 
      where('userId', '==', userId),
      where('name', '==', oldName)
    );
    const subjectSnapshot = await getDocs(subjectQuery);
    
    if (subjectSnapshot.empty) {
      return { success: false, error: 'Subject not found' };
    }

    // Update the subject document
    await updateDoc(subjectSnapshot.docs[0].ref, { name: newName });

    // Update all documents with this subject
    const documentsRef = collection(db, 'documents');
    const q = query(documentsRef, 
      where('user_id', '==', userId),
      where('subject', '==', oldName)
    );
    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { subject: newName })
    );
    await Promise.all(updatePromises);

    return { success: true };
  } catch (error) {
    console.error('Error renaming subject:', error);
    return { success: false, error: 'Failed to rename subject' };
  }
}
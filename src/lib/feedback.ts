import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface FeedbackData {
  userId: string;
  userName: string;
  email: string;
  message: string;
  type: 'feedback' | 'feature_request';
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
}

export async function submitFeedback(data: Omit<FeedbackData, 'createdAt'>): Promise<{ success: boolean; error?: string }> {
  try {
    const feedbackData: FeedbackData = {
      ...data,
      createdAt: new Date().toISOString()
    };

    const collectionRef = collection(db, data.type === 'feedback' ? 'feedback' : 'feature_requests');
    await addDoc(collectionRef, feedbackData);

    return { success: true };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit feedback'
    };
  }
}
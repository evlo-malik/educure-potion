import { collection, doc, getDoc, setDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export const PLAN_UPLOAD_LIMITS = {
  cooked: {
    weeklyDocuments: 2,
    monthlyLectures: 1,
    maxFileSize: 20 // 20 MB
  },
  commited: {
    weeklyDocuments: 10,
    monthlyLectures: 10,
    maxFileSize: 30 // 30 MB
  },
  'locked-in': {
    weeklyDocuments: Infinity,
    monthlyLectures: 45,
    maxFileSize: 50 // 40 MB
  }
};

interface UploadUsage {
  documents: {
    count: number;
    lastReset: Timestamp;
  };
  lectures: {
    count: number;
    lastReset: Timestamp;
  };
}

export async function checkUploadLimit(
  userId: string,
  uploadType: 'document' | 'lecture',
  userPlan: 'cooked' | 'commited' | 'locked-in',
  fileSize?: number
): Promise<{ allowed: boolean; error?: string; currentCount?: number; lastReset?: Timestamp }> {
  try {
    // Check file size limit if provided
    if (fileSize && uploadType === 'document') {
      const maxFileSize = PLAN_UPLOAD_LIMITS[userPlan].maxFileSize * 1024 * 1024; // Convert MB to bytes
      if (fileSize > maxFileSize) {
        return {
          allowed: false,
          error: `File size exceeds the ${PLAN_UPLOAD_LIMITS[userPlan].maxFileSize}MB limit for your plan. Please upgrade for larger file uploads.`
        };
      }
    }

    const usageRef = doc(db, 'uploadUsage', userId);
    const usageDoc = await getDoc(usageRef);
    const now = Timestamp.now();

    // Initialize usage data if it doesn't exist
    if (!usageDoc.exists()) {
      const initialUsage: UploadUsage = {
        documents: { count: 0, lastReset: now },
        lectures: { count: 0, lastReset: now }
      };
      await setDoc(usageRef, initialUsage);
    }

    const usage = usageDoc.exists() ? usageDoc.data() as UploadUsage : {
      documents: { count: 0, lastReset: now },
      lectures: { count: 0, lastReset: now }
    };

    // Check if reset is needed
    const resetUpdates: Partial<UploadUsage> = {};
    let currentCount = 0;

    if (uploadType === 'document') {
      const lastReset = usage.documents.lastReset.toDate();
      const daysSinceReset = Math.floor((now.toDate().getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceReset >= 7) {
        resetUpdates.documents = { count: 0, lastReset: now };
        currentCount = 0;
      } else {
        currentCount = usage.documents.count;
      }
    } else {
      const lastReset = usage.lectures.lastReset.toDate();
      const daysSinceReset = Math.floor((now.toDate().getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceReset >= 30) {
        resetUpdates.lectures = { count: 0, lastReset: now };
        currentCount = 0;
      } else {
        currentCount = usage.lectures.count;
      }
    }

    // Apply reset if needed
    if (Object.keys(resetUpdates).length > 0) {
      await setDoc(usageRef, resetUpdates, { merge: true });
    }

    // Get limit based on plan and upload type
    const limit = uploadType === 'document' 
      ? PLAN_UPLOAD_LIMITS[userPlan].weeklyDocuments
      : PLAN_UPLOAD_LIMITS[userPlan].monthlyLectures;

    // Check if user is within limits
    if (currentCount >= limit && limit !== Infinity) {
      const period = uploadType === 'document' ? 'weekly' : 'monthly';
      const upgradeMessage = userPlan === 'cooked' 
        ? 'Upgrade to Commited for increased limits!'
        : userPlan === 'commited'
          ? 'Upgrade to Locked In for unlimited document uploads!'
          : '';

      return {
        allowed: false,
        error: `You've reached your ${period} ${uploadType} upload limit. ${upgradeMessage}`
      };
    }

    return { 
      allowed: true,
      currentCount,
      lastReset: usage[uploadType === 'document' ? 'documents' : 'lectures'].lastReset
    };
  } catch (error) {
    console.error('Error checking upload limit:', error);
    return { 
      allowed: false, 
      error: 'Failed to verify upload limits. Please try again.' 
    };
  }
}

export async function incrementUploadCount(
  userId: string,
  uploadType: 'document' | 'lecture',
  currentCount: number,
  lastReset: Timestamp
): Promise<boolean> {
  try {
    const usageRef = doc(db, 'uploadUsage', userId);
    
    // Increment usage count
    await setDoc(usageRef, {
      [uploadType === 'document' ? 'documents' : 'lectures']: {
        count: currentCount + 1,
        lastReset
      }
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error incrementing upload count:', error);
    return false;
  }
}

export async function getUploadUsage(userId: string): Promise<{
  documents: number;
  lectures: number;
}> {
  try {
    const usageRef = doc(db, 'uploadUsage', userId);
    const usageDoc = await getDoc(usageRef);
    
    if (!usageDoc.exists()) {
      return { documents: 0, lectures: 0 };
    }

    const usage = usageDoc.data() as UploadUsage;
    return {
      documents: usage.documents.count,
      lectures: usage.lectures.count
    };
  } catch (error) {
    console.error('Error getting upload usage:', error);
    return { documents: 0, lectures: 0 };
  }
}
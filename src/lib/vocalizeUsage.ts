import { collection, doc, getDoc, getDocs, query, where, limit as queryLimit, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// Old price IDs (7 pro vocalizations)
const OLD_LOCKED_IN_PRICE_IDS = [
  'price_1QPXmwE4Vh8gPWWwc6Lkuz4W', // old monthly locked-in
  'price_1QPYjbE4Vh8gPWWwOBTX3eUW'  // old yearly locked-in
];

// New price IDs (5 pro vocalizations)
const NEW_LOCKED_IN_PRICE_IDS = [
  'price_1Qk2HsE4Vh8gPWWwE2n8MSRn', // new monthly locked-in
  'price_1Qk2McE4Vh8gPWWwdvem3SgQ'  // new yearly locked-in
];

export const VOCALIZE_LIMITS = {
  cooked: {
    standardVocalize: 1,
    proVocalize: 0
  },
  commited: {
    standardVocalize: 5,
    proVocalize: 2
  },
  'locked-in': {
    standardVocalize: 15,
    proVocalize: 5  // Default to new limit
  }
};

interface VocalizeUsage {
  standard: {
    count: number;
    lastReset: Timestamp;
  };
  pro: {
    count: number;
    lastReset: Timestamp;
  };
}

export async function checkVocalizeLimit(
  userId: string,
  style: string,
  userPlan: 'cooked' | 'commited' | 'locked-in'
): Promise<{ allowed: boolean; error?: string; type: 'standard' | 'pro' }> {
  try {
    const isProStyle = ['ASMR', 'Motivational', 'Storytelling'].includes(style);
    if (isProStyle && userPlan === 'cooked') {
      return {
        allowed: false,
        error: 'Pro Vocalize styles are only available for Commited and Locked In plans. Please upgrade to access these features!',
        type: 'pro'
      };
    }

    // Get user's subscription details to check price ID
    let proVocalizeLimit = VOCALIZE_LIMITS[userPlan].proVocalize;
    if (userPlan === 'locked-in') {
      const subscriptionsRef = collection(db, 'customers', userId, 'subscriptions');
      const subscriptionsSnapshot = await getDocs(query(
        subscriptionsRef,
        where('status', 'in', ['active', 'trialing']),
        queryLimit(1)
      ));

      if (!subscriptionsSnapshot.empty) {
        const subscription = subscriptionsSnapshot.docs[0].data();
        const priceId = subscription.items?.[0]?.price?.id;

        if (OLD_LOCKED_IN_PRICE_IDS.includes(priceId)) {
          proVocalizeLimit = 7;  // Old price IDs get 7 pro vocalizations
        }
      }
    }

    const usageRef = doc(db, 'vocalizeUsage', userId);
    const usageDoc = await getDoc(usageRef);
    const now = Timestamp.now();

    // Initialize usage data if it doesn't exist
    if (!usageDoc.exists()) {
      const initialUsage: VocalizeUsage = {
        standard: { count: 0, lastReset: now },
        pro: { count: 0, lastReset: now }
      };
      await setDoc(usageRef, initialUsage);
    }

    const usage = usageDoc.exists() ? usageDoc.data() as VocalizeUsage : {
      standard: { count: 0, lastReset: now },
      pro: { count: 0, lastReset: now }
    };

    // Check if monthly reset is needed
    const type = isProStyle ? 'pro' : 'standard';
    const lastReset = usage[type].lastReset.toDate();
    const daysSinceReset = Math.floor((now.toDate().getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceReset >= 30) {
      const resetUpdate = { count: 0, lastReset: now };
      await setDoc(usageRef, { [type]: resetUpdate }, { merge: true });
      usage[type].count = 0;
    }

    // Get limit based on plan and type
    const limit = isProStyle 
      ? proVocalizeLimit  // Use the determined limit
      : VOCALIZE_LIMITS[userPlan].standardVocalize;

    // Check if user is within limits
    if (usage[type].count >= limit) {
      const styleType = isProStyle ? 'Pro' : 'Standard';
      const upgradeMessage = userPlan === 'cooked' 
        ? 'Upgrade to Commited for increased limits!'
        : userPlan === 'commited'
          ? 'Upgrade to Locked In for higher limits!'
          : '';

      return {
        allowed: false,
        error: `You've reached your monthly ${styleType} Vocalize limit. ${upgradeMessage}`,
        type
      };
    }

    return { allowed: true, type };
  } catch (error) {
    console.error('Error checking vocalize limit:', error);
    return { 
      allowed: false, 
      error: 'Failed to verify vocalize limits. Please try again.',
      type: 'standard'
    };
  }
}

/**
 * Increments the vocalize usage count for a user.
 * IMPORTANT: This function should ONLY be called after successful voice generation.
 * Do not call this function if the voice generation fails to ensure users are not
 * charged for failed generations.
 */
export async function incrementVocalizeUsage(
  userId: string,
  type: 'standard' | 'pro'
): Promise<void> {
  try {
    const usageRef = doc(db, 'vocalizeUsage', userId);
    const usageDoc = await getDoc(usageRef);
    
    if (!usageDoc.exists()) {
      throw new Error('Usage document not found');
    }

    const usage = usageDoc.data() as VocalizeUsage;
    
    await setDoc(usageRef, {
      [type]: {
        count: usage[type].count + 1,
        lastReset: usage[type].lastReset
      }
    }, { merge: true });
  } catch (error) {
    console.error('Error incrementing vocalize usage:', error);
    throw error;
  }
}

export async function getVocalizeUsage(userId: string): Promise<{
  standard: number;
  pro: number;
}> {
  try {
    const usageRef = doc(db, 'vocalizeUsage', userId);
    const usageDoc = await getDoc(usageRef);
    
    if (!usageDoc.exists()) {
      return { standard: 0, pro: 0 };
    }

    const usage = usageDoc.data() as VocalizeUsage;
    return {
      standard: usage.standard.count,
      pro: usage.pro.count
    };
  } catch (error) {
    console.error('Error getting vocalize usage:', error);
    return { standard: 0, pro: 0 };
  }
}
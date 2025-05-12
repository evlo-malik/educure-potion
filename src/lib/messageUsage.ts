import { doc, getDoc, setDoc, increment, Timestamp, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { checkPurchaseStatus, processPurchasedMessages } from './purchaseManager';

interface MessageUsage {
  textMessages: {
    count: number;
    lastReset: Timestamp;
  };
  areaMessages: {
    count: number;
    lastReset: Timestamp;
  };
}

interface PurchasedMessages {
  textMessages: number;
  areaMessages: number;
}

const PLAN_LIMITS = {
  cooked: {
    dailyTextMessages: 3,
    weeklyAreaMessages: 1
  },
  commited: {
    dailyTextMessages: 30,
    weeklyAreaMessages: 15
  },
  'locked-in': {
    dailyTextMessages: Infinity,
    weeklyAreaMessages: 50
  }
};

export async function getMessageUsage(userId: string): Promise<{
  textMessages: number;
  areaMessages: number;
  purchasedTextMessages: number;
  purchasedAreaMessages: number;
}> {
  try {
    const [usageDoc, purchasedDoc] = await Promise.all([
      getDoc(doc(db, 'messageUsage', userId)),
      getDoc(doc(db, 'purchasedMessages', userId))
    ]);
    
    const usage = usageDoc.exists() ? usageDoc.data() as MessageUsage : { textMessages: { count: 0 }, areaMessages: { count: 0 } };
    const purchased = purchasedDoc.exists() ? purchasedDoc.data() as PurchasedMessages : { textMessages: 0, areaMessages: 0 };
    
    return {
      textMessages: usage.textMessages?.count || 0,
      areaMessages: usage.areaMessages?.count || 0,
      purchasedTextMessages: purchased.textMessages || 0,
      purchasedAreaMessages: purchased.areaMessages || 0
    };
  } catch (error) {
    console.error('Error getting message usage:', error);
    return { 
      textMessages: 0, 
      areaMessages: 0,
      purchasedTextMessages: 0,
      purchasedAreaMessages: 0
    };
  }
}

export async function addPurchasedMessages(
  userId: string,
  textMessages: number,
  areaMessages: number
): Promise<boolean> {
  try {
    const purchasedRef = doc(db, 'purchasedMessages', userId);
    const purchasedDoc = await getDoc(purchasedRef);

    if (!purchasedDoc.exists()) {
      await setDoc(purchasedRef, {
        textMessages,
        areaMessages,
        updatedAt: Timestamp.now()
      });
    } else {
      await updateDoc(purchasedRef, {
        textMessages: increment(textMessages),
        areaMessages: increment(areaMessages),
        updatedAt: Timestamp.now()
      });
    }

    // Record the transaction
    await addMessageTransaction(userId, {
      type: 'purchase',
      textMessages,
      areaMessages,
      timestamp: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('Error adding purchased messages:', error);
    return false;
  }
}

export async function checkMessageLimit(
  userId: string,
  messageType: 'text' | 'area',
  userPlan: 'cooked' | 'commited' | 'locked-in'
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const usageRef = doc(db, 'messageUsage', userId);
    const purchasedRef = doc(db, 'purchasedMessages', userId);
    
    // Get both current usage and purchased messages
    const [usageDoc, purchasedDoc] = await Promise.all([
      getDoc(usageRef),
      getDoc(purchasedRef)
    ]);

    const now = Timestamp.now();

    // Initialize usage data if it doesn't exist
    if (!usageDoc.exists()) {
      const initialUsage = {
        textMessages: { count: 0, lastReset: now },
        areaMessages: { count: 0, lastReset: now }
      };
      await setDoc(usageRef, initialUsage);
    }

    const usage = usageDoc.data() as MessageUsage;
    const purchased = purchasedDoc.exists() ? purchasedDoc.data() as PurchasedMessages : { textMessages: 0, areaMessages: 0 };

    // Check if reset is needed
    const resetUpdates: any = {};
    let resetNeeded = false;

    if (messageType === 'text') {
      const lastReset = usage.textMessages.lastReset.toDate();
      const isNewDay = new Date().getDate() !== lastReset.getDate();
      
      if (isNewDay) {
        resetUpdates.textMessages = { count: 0, lastReset: now };
        resetNeeded = true;
      }
    } else {
      const lastReset = usage.areaMessages.lastReset.toDate();
      const daysSinceReset = Math.floor((now.toDate().getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceReset >= 7) {
        resetUpdates.areaMessages = { count: 0, lastReset: now };
        resetNeeded = true;
      }
    }

    if (resetNeeded) {
      await updateDoc(usageRef, resetUpdates);
      usage[messageType === 'text' ? 'textMessages' : 'areaMessages'].count = 0;
    }

    // Check against plan limits
    const limits = PLAN_LIMITS[userPlan];
    const currentCount = messageType === 'text' 
      ? usage.textMessages.count 
      : usage.areaMessages.count;
    const limit = messageType === 'text' 
      ? limits.dailyTextMessages 
      : limits.weeklyAreaMessages;
    
    // If within plan limits, allow and increment
    if (currentCount < limit || limit === Infinity) {
      const updatePath = messageType === 'text' ? 'textMessages.count' : 'areaMessages.count';
      await updateDoc(usageRef, {
        [updatePath]: increment(1)
      });
      return { allowed: true };
    }

    // Check purchased messages
    const purchasedCount = messageType === 'text' ? purchased.textMessages : purchased.areaMessages;
    
    if (purchasedCount > 0) {
      // Use a purchased message
      await updateDoc(purchasedRef, {
        [messageType === 'text' ? 'textMessages' : 'areaMessages']: increment(-1)
      });

      // Record the usage
      await addMessageTransaction(userId, {
        type: 'usage',
        textMessages: messageType === 'text' ? -1 : 0,
        areaMessages: messageType === 'text' ? 0 : -1,
        timestamp: now
      });

      return { allowed: true };
    }

    // No messages available
    const timeframe = messageType === 'text' ? 'daily' : 'weekly';
    const upgradeMessage = userPlan === 'cooked' 
      ? 'Upgrade to Commited for increased limits or purchase additional messages!'
      : userPlan === 'commited'
        ? 'Upgrade to Locked In for unlimited text messages or purchase additional messages!'
        : 'Purchase additional messages to continue.';

    return {
      allowed: false,
      error: `You've reached your ${timeframe} message limit. ${upgradeMessage}`
    };
  } catch (error) {
    console.error('Error checking message limit:', error);
    return { allowed: false, error: 'Unable to process message at this time. Please try again.' };
  }
}

async function addMessageTransaction(userId: string, transaction: {
  type: 'usage' | 'purchase';
  textMessages: number;
  areaMessages: number;
  timestamp: Timestamp;
}) {
  try {
    const transactionsRef = collection(db, 'messageTransactions');
    await setDoc(doc(transactionsRef), {
      userId,
      ...transaction
    });
  } catch (error) {
    console.error('Error adding message transaction:', error);
  }
}

export async function processUnprocessedPayments(userId: string): Promise<void> {
  try {
    // Get all payments
    const paymentsRef = collection(db, 'customers', userId, 'payments');
    const paymentsSnapshot = await getDocs(paymentsRef);

    for (const paymentDoc of paymentsSnapshot.docs) {
      const paymentId = paymentDoc.id;
      
      // Check if payment has already been processed
      const isProcessed = await checkPurchaseStatus(userId, paymentId);
      
      if (!isProcessed) {
        // Process the payment
        await processPurchasedMessages(userId, paymentId);
      }
    }
  } catch (error) {
    console.error('Error processing unprocessed payments:', error);
  }
}
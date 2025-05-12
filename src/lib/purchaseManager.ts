import { collection, doc, getDoc, setDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

interface PaymentMetadata {
  text_messages?: string;
  area_messages?: string;
  textMessages?: string;
  areaMessages?: string;
}

export async function processPurchasedMessages(userId: string, paymentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Get the payment document
    const paymentDoc = await getDoc(
      doc(db, 'customers', userId, 'payments', paymentId)
    );

    if (!paymentDoc.exists()) {
      throw new Error('Payment not found');
    }

    const paymentData = paymentDoc.data();
    const metadata = paymentData.metadata as PaymentMetadata;

    // Extract message quantities, handling different possible field names
    const textMessages = parseInt(
      metadata.text_messages || metadata.textMessages || '0'
    );
    const areaMessages = parseInt(
      metadata.area_messages || metadata.areaMessages || '0'
    );

    if (isNaN(textMessages) && isNaN(areaMessages)) {
      throw new Error('Invalid message quantities in payment metadata');
    }

    // Get reference to purchasedMessages document
    const purchasedRef = doc(db, 'purchasedMessages', userId);
    const purchasedDoc = await getDoc(purchasedRef);

    if (!purchasedDoc.exists()) {
      // Create new document if it doesn't exist
      await setDoc(purchasedRef, {
        textMessages,
        areaMessages,
        updatedAt: Timestamp.now(),
        paymentIds: [paymentId]
      });
    } else {
      // Update existing document
      await updateDoc(purchasedRef, {
        textMessages: increment(textMessages),
        areaMessages: increment(areaMessages),
        updatedAt: Timestamp.now(),
        paymentIds: [...(purchasedDoc.data().paymentIds || []), paymentId]
      });
    }

    // Add a record to the messageTransactions collection
    await addMessageTransaction(userId, {
      type: 'purchase',
      textMessages,
      areaMessages,
      paymentId,
      timestamp: Timestamp.now()
    });

    return { success: true };
  } catch (error) {
    console.error('Error processing purchased messages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process message purchase'
    };
  }
}

interface MessageTransaction {
  type: 'purchase' | 'usage';
  textMessages: number;
  areaMessages: number;
  paymentId?: string;
  timestamp: Timestamp;
}

async function addMessageTransaction(userId: string, transaction: MessageTransaction) {
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

export async function checkPurchaseStatus(userId: string, paymentId: string): Promise<boolean> {
  try {
    const purchasedRef = doc(db, 'purchasedMessages', userId);
    const purchasedDoc = await getDoc(purchasedRef);
    
    if (!purchasedDoc.exists()) {
      return false;
    }

    const paymentIds = purchasedDoc.data().paymentIds || [];
    return paymentIds.includes(paymentId);
  } catch (error) {
    console.error('Error checking purchase status:', error);
    return false;
  }
}
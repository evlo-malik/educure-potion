import { loadStripe } from '@stripe/stripe-js';
import { collection, addDoc, onSnapshot, doc, getDoc, getDocs, query, where, limit, Timestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from './firebase';
import { addPurchasedMessages } from './messageUsage';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Price IDs for subscriptions
const PRICE_TO_PLAN = {
  'price_1Qk2McE4Vh8gPWWwdvem3SgD': 'locked-in-yearly',
  'price_1Qk2eeE4Vh8gPWWwjfNAnatm': 'commited-yearly',
  'price_1Qk2HsE4Vh8gPWWwE2n8MSRA': 'locked-in-monthly',
  'price_1Qk2CoE4Vh8gPWWwGjnzPbGK': 'commited-monthly'
};

// Price IDs for message purchases
const MESSAGE_PRICES = {
  text: 'price_1QRbs9E4Vh8gPWWw2XFyktLD',
  area: 'price_1QRbriE4Vh8gPWWwSICwBNsE'
};

export interface SubscriptionData {
  priceId: string;
  customerId?: string;
  subscriptionId?: string;
  subscriptionItemId?: string;
  status?: string;
  currentPeriodEnd?: number;
  plan?: string;
  cancelAtPeriodEnd?: boolean;
  claimed?: boolean;
  startDate?: number;
  isNew?: boolean;
}

export async function createCheckoutSession(
  priceId: string,
  userId: string,
  isSubscriptionChange: boolean = false,
  messageData?: {
    textAmount: number;
    areaAmount: number;
    textMessages: number;
    areaMessages: number;
  }
) {
  try {
    let metadata: Record<string, string> = {
      userId,
    };

    // If this is a subscription change and user is NOT on cooked plan,
    // use the update function for prorations
    if (isSubscriptionChange) {
      const currentSub = await getCurrentSubscription(userId);
      if (currentSub && currentSub.status !== 'inactive') {
        return updateSubscription(userId, priceId);
      }
    }

    let sessionData: any = {
      success_url: window.location.origin + '/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: window.location.origin + '/pricing',
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      collect_shipping_address: false,
      payment_method_types: ['card', 'revolut_pay', 'link', 'paypal']
    };

    if (messageData) {
      // Handle message purchase
      metadata.type = 'message_purchase';
      metadata.textMessages = messageData.textMessages.toString();
      metadata.areaMessages = messageData.areaMessages.toString();

      sessionData = {
        ...sessionData,
        mode: 'payment',
        success_url: window.location.origin + '/dashboard',
        cancel_url: window.location.origin + '/purchase-messages',
        line_items: [
          ...(messageData.textMessages > 0 ? [{
            price: MESSAGE_PRICES.text,
            quantity: messageData.textMessages
          }] : []),
          ...(messageData.areaMessages > 0 ? [{
            price: MESSAGE_PRICES.area,
            quantity: messageData.areaMessages
          }] : [])
        ],
        metadata
      };
    } else {
      // Handle new subscription or upgrade from cooked plan
      metadata.plan = PRICE_TO_PLAN[priceId as keyof typeof PRICE_TO_PLAN] || 'unknown';
      sessionData = {
        ...sessionData,
        mode: 'subscription',
        line_items: [{
          price: priceId,
          quantity: 1
        }],
        metadata
      };
    }

    const checkoutSessionRef = await addDoc(
      collection(db, 'customers', userId, 'checkout_sessions'),
      sessionData
    );

    return new Promise<{ success: boolean; error?: string }>((resolve, reject) => {
      const unsubscribe = onSnapshot(checkoutSessionRef, async (snap) => {
        const { error, url } = snap.data() as { error?: { message: string }; url?: string };

        if (error) {
          unsubscribe();
          reject(new Error(`An error occurred: ${error.message}`));
        }

        if (url) {
          unsubscribe();
          window.location.href = url;
          resolve({ success: true });
        }
      });

      // Timeout after 2 minutes
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Checkout session creation timeout'));
      }, 120000);
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create checkout session' 
    };
  }
}

export async function cancelSubscription(userId: string): Promise<{ success: boolean; error?: string; currentPeriodEnd?: number }> {
  try {
    let subscription = await getCurrentSubscription(userId);
    console.log('Initial subscription data:', subscription);

    if (!subscription || subscription.status === 'inactive') {
      return {
        success: false,
        error: 'No active subscription found'
      };
    }

    // Get the subscription document directly
    const subscriptionsRef = collection(db, 'customers', userId, 'subscriptions');
    const subDoc = await getDoc(doc(subscriptionsRef, subscription.subscriptionId));
    
    if (!subDoc.exists()) {
      return {
        success: false,
        error: 'Subscription document not found'
      };
    }

    const subData = subDoc.data();
    console.log('Subscription document data:', subData);

    // Try to get customer ID from different possible locations in the data
    subscription.customerId = subData.customer || subData.stripeId || subData.metadata?.customerId;

    if (!subscription.customerId) {
      // If still no customer ID, try getting it from the customer collection
      const customerRef = doc(db, 'customers', userId);
      const customerSnap = await getDoc(customerRef);
      const customerData = customerSnap.data();
      subscription.customerId = customerData?.stripeId;
      console.log('Customer data:', customerData);
    }

    console.log('Final subscription data:', subscription);

    if (!subscription.subscriptionId || !subscription.customerId) {
      return {
        success: false,
        error: 'Unable to find customer ID for subscription'
      };
    }

    // Create a cancellation request with immediate effect
    const cancelRef = await addDoc(collection(db, 'customers', userId, 'cancellation_requests'), {
      timestamp: Timestamp.now(),
      subscriptionId: subscription.subscriptionId,
      customerId: subscription.customerId,
      status: 'pending',
      cancelImmediately: true,
      cancelAtPeriodEnd: true
    });

    // Listen for the cancellation result
    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(cancelRef, (snap) => {
        const data = snap.data();
        console.log('Cancellation request status:', data);
        if (data?.status === 'completed') {
          unsubscribe();
          resolve({
            success: true,
            currentPeriodEnd: subscription?.currentPeriodEnd
          });
        } else if (data?.status === 'failed') {
          unsubscribe();
          reject(new Error(data.error || 'Failed to cancel subscription'));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Cancellation request timed out'));
      }, 30000);
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel subscription'
    };
  }
}

async function getCurrentSubscription(userId: string): Promise<SubscriptionData | null> {
  const subscriptionsRef = collection(db, 'customers', userId, 'subscriptions');
  const activeQuery = query(
    subscriptionsRef,
    where('status', 'in', ['active', 'trialing']),
    limit(1)
  );

  const snapshot = await getDocs(activeQuery);
  if (!snapshot.empty) {
    const subscriptionDoc = snapshot.docs[0];
    const data = subscriptionDoc.data();
    
    // First try to get customer ID from the subscription data
    let customerId = data.customer;
    
    // If no customer ID in subscription data, try getting it from customer data
    if (!customerId) {
      const customerRef = doc(db, 'customers', userId);
      const customerSnap = await getDoc(customerRef);
      const customerData = customerSnap.data();
      customerId = customerData?.stripeId;
    }
    
    return {
      subscriptionId: subscriptionDoc.id,
      subscriptionItemId: data.items?.[0]?.id,
      priceId: data.items?.[0]?.price?.id,
      customerId: customerId,
      status: data.status,
      currentPeriodEnd: data.current_period_end?.seconds,
      cancelAtPeriodEnd: data.cancel_at_period_end || false
    };
  }

  return null;
}

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionData | null> {
  try {
    const subscriptionsRef = collection(db, 'customers', userId, 'subscriptions');
    const activeQuery = query(
      subscriptionsRef,
      where('status', 'in', ['active', 'trialing']),
      limit(1)
    );

    const subscriptionSnapshot = await getDocs(activeQuery);

    if (!subscriptionSnapshot.empty) {
      const subscriptionDoc = subscriptionSnapshot.docs[0];
      const subscription = subscriptionDoc.data();
      const customerRef = doc(db, 'customers', userId);
      const customerSnap = await getDoc(customerRef);
      const customerData = customerSnap.data();

      const priceId = subscription.items?.[0]?.price?.id;
      const plan = PRICE_TO_PLAN[priceId as keyof typeof PRICE_TO_PLAN]?.split('-')[0] || 'cooked';
      
      // Get the start date from the subscription
      const startDate = subscription.created?.seconds || subscription.start_date?.seconds;
      const isNew = startDate ? Date.now() / 1000 - startDate < 24 * 60 * 60 : false; // Check if subscription is less than 24 hours old

      return {
        priceId: subscription.items?.[0]?.price?.id || subscription.price_id,
        customerId: customerData?.stripeId || subscription.customer,
        subscriptionId: subscriptionDoc.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end?.seconds,
        plan,
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        claimed: subscription.claimed || false,
        startDate,
        isNew
      };
    }

    return {
      priceId: '',
      status: 'inactive',
      plan: 'cooked'
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return {
      priceId: '',
      status: 'error',
      plan: 'cooked'
    };
  }
}

export async function createCustomerPortalSession(userId: string) {
  try {
    // Get current subscription to get customer ID
    const subscription = await getCurrentSubscription(userId);
    if (!subscription?.customerId) {
      throw new Error('No customer ID found');
    }
    
    // Get Firebase Functions instance
    const functions = getFunctions();
    
    // Call our CORS-enabled endpoint
    const createPortalLink = httpsCallable(functions, 'stripePortal');

    // Call the function with the customer ID
    const { data } = await createPortalLink({
      customerId: subscription.customerId
    });

    // Check if we got a URL back
    if (!data || typeof data !== 'object' || !('url' in data)) {
      throw new Error('Invalid response from portal creation');
    }

    // Redirect to the portal URL
    window.location.assign((data as { url: string }).url);

    return { success: true };
  } catch (error) {
    console.error('Error creating portal session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create portal session'
    };
  }
}

// Webhook handler for the backend
export const handleStripeWebhook = async (event: any) => {
  const { type, data } = event;

  if (type === 'checkout.session.completed') {
    const session = data.object;
    const { metadata } = session;

    if (metadata?.type === 'message_purchase') {
      const userId = metadata.userId;
      const textMessages = parseInt(metadata.textMessages || '0');
      const areaMessages = parseInt(metadata.areaMessages || '0');

      // Add purchased messages to user's account
      await addPurchasedMessages(userId, textMessages, areaMessages);
    }
  }
};

export async function updateSubscription(
  userId: string,
  newPriceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentSub = await getCurrentSubscription(userId);
    if (!currentSub?.subscriptionId) {
      throw new Error('No active subscription found');
    }

    // Create a subscription update request
    const updateRef = await addDoc(
      collection(db, 'customers', userId, 'subscription_updates'),
      {
        timestamp: Timestamp.now(),
        subscriptionId: currentSub.subscriptionId,
        newPriceId: newPriceId,
        status: 'pending',
        proration_behavior: 'always_invoice'
      }
    );

    // Wait for the update to complete
    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(updateRef, (snap) => {
        const data = snap.data();
        if (data?.status === 'completed') {
          unsubscribe();
          resolve({ success: true });
        } else if (data?.status === 'failed') {
          unsubscribe();
          reject(new Error(data.error || 'Failed to update subscription'));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        unsubscribe();
        reject(new Error('Update request timed out'));
      }, 30000);
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update subscription'
    };
  }
}
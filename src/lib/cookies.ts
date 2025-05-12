import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Interface describing our user info structure
export interface UserInfo {
  cookiePreferences: {
    acceptAll: boolean;
    lastUpdated: Date;
  };
  deviceInfo: {
    browser: string;
    os: string;
    device: string;
    screenResolution: string;
    language: string;
    timezone: string;
    ipAddress: string;
  };
  userInfo: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  visits: {
    first: Date;
    last: Date;
    count: number;
  };
  userAgent: string;
  updatedAt: Date;
}

// Utility function to safely retrieve a cookie value by name
function getCookie(name: string): string | null {
  const matches = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1')}=([^;]*)`)
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}

// Helper functions to parse user agent
function getBrowser(userAgent: string): string {
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Other';
}

function getOS(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'MacOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iPhone') || userAgent.includes('iPad') || userAgent.includes('iPod')) return 'iOS';
  return 'Other';
}

function getDevice(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'Mobile';
  if (/tablet/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

/**
 * Saves or updates user information in Firestore.
 * Also retrieves phone and email from cookies if available.
 */
export async function saveUserInfo(userId: string, acceptAll: boolean): Promise<boolean> {
  try {
    // References
    const userInfoRef = doc(db, 'Users Info', userId);
    const timestamp = new Date();
    const userAgent = window.navigator.userAgent;

    // Fetch existing user info
    const existingDoc = await getDoc(userInfoRef);
    const existingData = existingDoc.exists() ? existingDoc.data() : null;

    // Get user data from 'users' collection
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : null;

    // Retrieve phone and email from cookies
    // Make sure to check if these cookies exist before storing
    const phoneFromCookie = getCookie('userPhone');
    const emailFromCookie = getCookie('userEmail');

    // Get IP address (consider graceful handling if IPify is down or blocked)
    let ipAddress = '0.0.0.0';
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json', { timeout: 5000 });
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;
    } catch (ipError) {
      console.warn('Failed to fetch IP address:', ipError);
    }

    // Construct the updated user info
    const userInfo: UserInfo = {
      cookiePreferences: {
        acceptAll,
        lastUpdated: timestamp
      },
      deviceInfo: {
        browser: getBrowser(userAgent),
        os: getOS(userAgent),
        device: getDevice(userAgent),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ipAddress
      },
      userInfo: {
        // Merge data from Firestore's 'users' collection with cookies
        name: userData?.name || null,
        email: emailFromCookie || userData?.email || null,
        phone: phoneFromCookie || userData?.phone || null
      },
      visits: {
        first: existingData?.visits?.first || timestamp,
        last: timestamp,
        count: (existingData?.visits?.count || 0) + 1
      },
      userAgent,
      updatedAt: timestamp
    };

    // Save to Firestore (with merge to preserve existing fields)
    await setDoc(userInfoRef, userInfo, { merge: true });

    // Optionally save minimal info to localStorage (avoid storing PII in localStorage)
    localStorage.setItem('cookiePreferences', JSON.stringify({
      acceptAll,
      lastUpdated: timestamp
    }));

    return true;
  } catch (error) {
    console.error('Error saving user info:', error);
    return false;
  }
}

/**
 * Retrieves user information from Firestore.
 */
export async function getUserInfo(userId: string): Promise<UserInfo | null> {
  try {
    const userInfoRef = doc(db, 'Users Info', userId);
    const userInfoDoc = await getDoc(userInfoRef);

    if (userInfoDoc.exists()) {
      return userInfoDoc.data() as UserInfo;
    }

    return null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

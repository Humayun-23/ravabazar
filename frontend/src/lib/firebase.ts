import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const requestForToken = async () => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("Firebase messaging is not supported in this browser.");
      return null;
    }

    const messaging = getMessaging(app);
    // VAPID key is required to receive push notifications
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.warn("VAPID key is not set. Push notifications will not work.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, { vapidKey });
      if (currentToken) {
        return currentToken;
      } else {
        console.warn("No registration token available.");
        return null;
      }
    } else {
      console.warn("Notification permission denied.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token: ", error);
    return null;
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  isSupported().then((supported) => {
    if (supported) {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        callback(payload);
      });
    }
  });
};

export { app };

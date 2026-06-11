import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBHhUh_qPavlGYXmEmR2NS0iRdqpEDkQHA",
  authDomain: "the-cockpit-21949.firebaseapp.com",
  projectId: "the-cockpit-21949",
  storageBucket: "the-cockpit-21949.firebasestorage.app",
  messagingSenderId: "573671862515",
  appId: "1:573671862515:web:8c7b702e457bd8cb5a4786",
};

const VAPID_KEY = "BB2YUOfUmT2DUjF59RzfFAud_ufc-LEAuYXsC_XlfGBZyrgCfr1nH2YRQdzygQJ8wV3YRig_T9K0THEvWfGJZP0";

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function requestNotificationPermission(userName) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    if (token) {
      // Save token to Google Sheet so server can send notifications
      await fetch(
        "https://script.google.com/macros/s/AKfycbzq-SohecQc4eKbre6TJrW7T50isYP-IrAyMvRZpq5uYyaDPeIxDNivmB5rxY3w74xN/exec",
        {
          method: "POST",
          body: JSON.stringify({ action: "saveToken", name: userName, token }),
        }
      );
      return token;
    }
  } catch (err) {
    console.error("Notification setup error:", err);
  }
  return null;
}

export function onForegroundMessage(callback) {
  return onMessage(messaging, callback);
}

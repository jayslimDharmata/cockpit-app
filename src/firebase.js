import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBHhUh_qPavlGYXmEmR2NS0iRdqpEDkQHA",
  authDomain: "the-cockpit-21949.firebaseapp.com",
  projectId: "the-cockpit-21949",
  storageBucket: "the-cockpit-21949.firebasestorage.app",
  messagingSenderId: "573671862515",
  appId: "1:573671862515:web:e48adb01db95d1225a4786",
};

const VAPID_KEY = "BB2YUOfUmT2DUjF59RzfFAud_ufc-LEAuYXsC_XlfGBZyrgCfr1nH2YRQdzygQJ8wV3YRig_T9K0THEvWfGJZP0";
const API_URL = "https://script.google.com/macros/s/AKfycbzq-SohecQc4eKbre6TJrW7T50isYP-IrAyMvRZpq5uYyaDPeIxDNivmB5rxY3w74xN/exec";

let app, messaging, auth;

try {
  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
  auth = getAuth(app);
  console.log("Cockpit Firebase: initialized");
} catch(err) {
  console.error("Cockpit Firebase: init failed", err);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function getTokenWithRetry(messaging, options, maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Cockpit Firebase: getToken attempt ${attempt}/${maxAttempts}`);
      const token = await getToken(messaging, options);
      if (token) {
        console.log("Cockpit Firebase: token obtained on attempt", attempt);
        return token;
      }
    } catch(err) {
      console.warn(`Cockpit Firebase: attempt ${attempt} failed:`, err.message);
      if (attempt < maxAttempts) {
        const delay = attempt * 3000; // 3s, 6s, 9s, 12s
        console.log(`Cockpit Firebase: retrying in ${delay/1000}s...`);
        await sleep(delay);
      }
    }
  }
  return null;
}

export async function requestNotificationPermission(userName) {
  try {
    if (!messaging) {
      console.error("Cockpit Firebase: messaging not initialized");
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    console.log("Cockpit Firebase: permission =", permission);
    if (permission !== "granted") return null;

    // Sign in anonymously
    try {
      await signInAnonymously(auth);
      console.log("Cockpit Firebase: signed in anonymously");
    } catch(authErr) {
      console.warn("Cockpit Firebase: anonymous auth failed, continuing anyway", authErr.message);
    }

    // Register service worker
    let swRegistration;
    try {
      swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      await navigator.serviceWorker.ready;
      console.log("Cockpit Firebase: service worker ready");
    } catch(swErr) {
      console.error("Cockpit Firebase: service worker error", swErr);
      return null;
    }

    // Get FCM token with retry
    const token = await getTokenWithRetry(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      console.log("Cockpit Firebase: saving token...");
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "saveToken", name: userName, token }),
      });
      const data = await res.json();
      console.log("Cockpit Firebase: token saved", data);
      return token;
    } else {
      console.error("Cockpit Firebase: failed to get token after all retries");
    }
  } catch(err) {
    console.error("Cockpit Firebase: error", err);
  }
  return null;
}

export function onForegroundMessage(callback) {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}

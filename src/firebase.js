import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBHhUh_qPavlGYXmEmR2NS0iRdqpEDkQHA",
  authDomain: "the-cockpit-21949.firebaseapp.com",
  projectId: "the-cockpit-21949",
  storageBucket: "the-cockpit-21949.firebasestorage.app",
  messagingSenderId: "573671862515",
  appId: "1:573671862515:web:8c7b702e457bd8cb5a4786",
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

    // Sign in anonymously so Firebase accepts the token request
    console.log("Cockpit Firebase: signing in anonymously...");
    const userCredential = await signInAnonymously(auth);
    console.log("Cockpit Firebase: signed in", userCredential.user.uid);

    // Register service worker and wait for activation
    let swRegistration;
    try {
      swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      await new Promise((resolve) => {
        if (swRegistration.active) { resolve(); return; }
        const sw = swRegistration.installing || swRegistration.waiting;
        if (sw) {
          sw.addEventListener("statechange", () => {
            if (sw.state === "activated") resolve();
          });
        } else {
          resolve();
        }
      });
      console.log("Cockpit Firebase: service worker ready");
    } catch(swErr) {
      console.error("Cockpit Firebase: service worker error", swErr);
      return null;
    }

    // Get FCM token
    console.log("Cockpit Firebase: getting token...");
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    console.log("Cockpit Firebase: token =", token ? token.substring(0,20)+"..." : "NONE");

    if (token) {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "saveToken", name: userName, token }),
      });
      const data = await res.json();
      console.log("Cockpit Firebase: token saved", data);
      return token;
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

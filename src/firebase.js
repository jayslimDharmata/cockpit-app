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

let app, messaging;

try {
  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
  console.log("Cockpit Firebase: initialized");
} catch(err) {
  console.error("Cockpit Firebase: init failed", err);
}

async function getActiveServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers not supported");
  }

  // Register the service worker
  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  console.log("Cockpit Firebase: service worker registered", registration.scope);

  // Wait for it to be active
  if (registration.active) {
    console.log("Cockpit Firebase: service worker already active");
    return registration;
  }

  // Wait for activation
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Service worker activation timeout")), 10000);
    const sw = registration.installing || registration.waiting;
    if (!sw) {
      clearTimeout(timeout);
      resolve(registration);
      return;
    }
    sw.addEventListener("statechange", (e) => {
      if (e.target.state === "activated") {
        clearTimeout(timeout);
        console.log("Cockpit Firebase: service worker activated");
        resolve(registration);
      }
    });
  });
}

export async function requestNotificationPermission(userName) {
  try {
    if (!messaging) {
      console.error("Cockpit Firebase: messaging not initialized");
      return null;
    }

    const permission = await Notification.requestPermission();
    console.log("Cockpit Firebase: permission =", permission);
    if (permission !== "granted") return null;

    // Get active service worker first
    const registration = await getActiveServiceWorker();

    console.log("Cockpit Firebase: getting FCM token...");
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    console.log("Cockpit Firebase: token obtained", token ? "YES" : "NO");

    if (token) {
      const res = await fetch(
        "https://script.google.com/macros/s/AKfycbzq-SohecQc4eKbre6TJrW7T50isYP-IrAyMvRZpq5uYyaDPeIxDNivmB5rxY3w74xN/exec",
        {
          method: "POST",
          body: JSON.stringify({ action: "saveToken", name: userName, token }),
        }
      );
      const data = await res.json();
      console.log("Cockpit Firebase: token saved to Sheet", data);
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

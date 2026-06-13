// Direct Web Push implementation - bypasses Firebase SDK token registration issues

const VAPID_PUBLIC_KEY = "BB2YUOfUmT2DUjF59RzfFAud_ufc-LEAuYXsC_XlfGBZyrgCfr1nH2YRQdzygQJ8wV3YRig_T9K0THEvWfGJZP0";
const API_URL = "https://script.google.com/macros/s/AKfycbzq-SohecQc4eKbre6TJrW7T50isYP-IrAyMvRZpq5uYyaDPeIxDNivmB5rxY3w74xN/exec";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestNotificationPermission(userName) {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Cockpit: Push notifications not supported on this browser");
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    console.log("Cockpit: notification permission =", permission);
    if (permission !== "granted") return null;

    // Register service worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("Cockpit: service worker registered");

    // Wait for it to be ready
    await navigator.serviceWorker.ready;
    console.log("Cockpit: service worker ready");

    // Subscribe to push using Web Push API directly
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log("Cockpit: push subscription obtained");

    // Save subscription to Google Sheet
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "saveToken",
        name: userName,
        token: JSON.stringify(subscription),
      }),
    });
    const data = await res.json();
    console.log("Cockpit: subscription saved to Sheet", data);
    return subscription;

  } catch(err) {
    console.error("Cockpit: push setup error", err);
  }
  return null;
}

export function onForegroundMessage(callback) {
  // Listen for messages from service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "PUSH_RECEIVED") {
        callback(event.data.payload);
      }
    });
  }
  return () => {};
}

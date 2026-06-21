// Native Web Push — no Firebase, no OneSignal, just the browser's Push API

const VAPID_PUBLIC_KEY = "BOhwLit8-GlgUhDXvb2oOEVi7tZOspqraJ2r-oInm2DkcsxSJnHKLfOvEvVXpIyoVdIJcsT9RGYPodwe7CBgeCA";
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
      console.log("Cockpit Push: not supported on this browser");
      return null;
    }

    const permission = await Notification.requestPermission();
    console.log("Cockpit Push: permission =", permission);
    if (permission !== "granted") return null;

    // Register our own minimal service worker
    const registration = await navigator.serviceWorker.register("/push-sw.js");
    console.log("Cockpit Push: service worker registered");
    await navigator.serviceWorker.ready;
    console.log("Cockpit Push: service worker ready");

    // Subscribe directly to the browser's push service (Google/Apple/Mozilla)
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log("Cockpit Push: new subscription created");
    } else {
      console.log("Cockpit Push: using existing subscription");
    }

    // Save the subscription object to the Sheet
    const subJson = JSON.stringify(subscription.toJSON());
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "saveToken", name: userName, token: subJson }),
    });
    const data = await res.json();
    console.log("Cockpit Push: subscription saved", data);
    return subscription;

  } catch(err) {
    console.error("Cockpit Push: error", err);
  }
  return null;
}

export function onForegroundMessage(callback) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "PUSH_RECEIVED") {
        callback(event.data.payload);
      }
    });
  }
  return () => {};
}

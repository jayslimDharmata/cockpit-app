// OneSignal Web Push integration for The Cockpit

const ONESIGNAL_APP_ID = "7d6a394d-4aa2-4113-a76a-32e463448222";
const API_URL = "https://script.google.com/macros/s/AKfycbzq-SohecQc4eKbre6TJrW7T50isYP-IrAyMvRZpq5uYyaDPeIxDNivmB5rxY3w74xN/exec";

let initialized = false;

function loadOneSignalSDK() {
  return new Promise((resolve, reject) => {
    if (window.OneSignal) {
      resolve(window.OneSignal);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.onload = () => resolve(window.OneSignal);
    script.onerror = () => reject(new Error("Failed to load OneSignal SDK"));
    document.head.appendChild(script);
  });
}

export async function requestNotificationPermission(userName) {
  try {
    console.log("Cockpit OneSignal: loading SDK...");

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    return new Promise((resolve) => {
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          if (!initialized) {
            await OneSignal.init({
              appId: ONESIGNAL_APP_ID,
              allowLocalhostAsSecureOrigin: true,
            });
            initialized = true;
            console.log("Cockpit OneSignal: initialized");
          }

          // Request permission
          const permission = await OneSignal.Notifications.requestPermission();
          console.log("Cockpit OneSignal: permission granted =", permission);

          if (!permission) {
            resolve(null);
            return;
          }

          // Tag this subscription with the user's name so we can target them
          await OneSignal.User.addAlias("cockpit_name", userName);
          await OneSignal.User.addTag("name", userName);

          // Get the OneSignal subscription ID (player id)
          const subscriptionId = OneSignal.User.PushSubscription.id;
          console.log("Cockpit OneSignal: subscription ID =", subscriptionId);

          if (subscriptionId) {
            const res = await fetch(API_URL, {
              method: "POST",
              body: JSON.stringify({
                action: "saveToken",
                name: userName,
                token: subscriptionId,
              }),
            });
            const data = await res.json();
            console.log("Cockpit OneSignal: saved to Sheet", data);
          }

          resolve(subscriptionId);
        } catch(err) {
          console.error("Cockpit OneSignal: error inside deferred", err);
          resolve(null);
        }
      });

      // Load the SDK script
      loadOneSignalSDK().catch(err => {
        console.error("Cockpit OneSignal: SDK load failed", err);
        resolve(null);
      });
    });
  } catch(err) {
    console.error("Cockpit OneSignal: error", err);
    return null;
  }
}

export function onForegroundMessage(callback) {
  // OneSignal handles foreground display automatically via its SDK
  // This is a no-op for compatibility with existing App.jsx code
  return () => {};
}

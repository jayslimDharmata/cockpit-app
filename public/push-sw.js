// push-sw.js — minimal native Web Push service worker
// No SDKs, no third-party imports. Pure browser Push API.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch(e) {
    data = { title: "The Cockpit", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "The Cockpit 🍺";
  const options = {
    body: data.body || "Something's happening at the bar",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [200, 100, 200],
    data: data,
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: "PUSH_RECEIVED", payload: data });
        });
      }),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return self.clients.openWindow("/");
    })
  );
});

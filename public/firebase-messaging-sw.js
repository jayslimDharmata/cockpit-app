// Service worker for Web Push notifications
// Place this file in the PUBLIC folder

self.addEventListener("push", (event) => {
  console.log("Cockpit SW: push received", event);

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
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow("/");
    })
  );
});

// Tell the app when a push is received while it's open
self.addEventListener("push", (event) => {
  if (self.clients) {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: "PUSH_RECEIVED",
          payload: event.data ? event.data.json() : {},
        });
      });
    });
  }
});

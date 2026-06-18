importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBHhUh_qPavlGYXmEmR2NS0iRdqpEDkQHA",
  authDomain: "the-cockpit-21949.firebaseapp.com",
  projectId: "the-cockpit-21949",
  storageBucket: "the-cockpit-21949.firebasestorage.app",
  messagingSenderId: "573671862515",
  appId: "1:573671862515:web:8c7b702e457bd8cb5a4786",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Background message received:", payload);
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "The Cockpit", {
    body: body || "Something's happening at the bar",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [200, 100, 200],
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type:"window", includeUncontrolled:true }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow("/");
    })
  );
});

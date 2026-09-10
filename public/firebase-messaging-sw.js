importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCqJh-YayGYGR-OFEMc1Oa9UTrXQPjCN6s", // from Firebase Console > Project settings > Your apps > Web app
  authDomain: "mepco-esafety.firebaseapp.com",
  projectId: "mepco-esafety",
  storageBucket: "mepco-esafety.appspot.com",
  messagingSenderId: "97210344550",
  appId: "1:97210344550:web:f6c16742a03e3a501db9a7",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body,
    icon: "/firebase-logo.png",
    data: payload.data,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const ptwId = event.notification.data?.ptw_id;
  if (ptwId) {
    const url = `${self.location.origin}/ptw/${ptwId}`;
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (client.url === url && "focus" in client) return client.focus();
          }
          if (clients.openWindow) return clients.openWindow(url);
        })
    );
  }
});
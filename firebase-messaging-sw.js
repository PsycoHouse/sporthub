importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBTDz0R8WkY4ov8_28JMpe0jVmSD05oJb4",
  authDomain: "sport-project-301c2.firebaseapp.com",
  databaseURL: "https://sport-project-301c2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "sport-project-301c2",
  storageBucket: "sport-project-301c2.firebasestorage.app",
  messagingSenderId: "743420630517",
  appId: "1:743420630517:web:c99cdf9dcd7699aa37fcbc",
  measurementId: "G-BG3SE17BB7"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const notification = payload.notification || {};

  self.registration.showNotification(notification.title || "SportHub", {
    body: notification.body || "Neue Benachrichtigung",
    icon: new URL("icons/icon-192.png", self.registration.scope).href
  });
});

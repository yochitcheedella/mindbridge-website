importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDnT6SqOLBmL69ht-fhh9abuDjVzfhoRc4",
  authDomain: "mind-bridge-7b156.firebaseapp.com",
  projectId: "mind-bridge-7b156",
  storageBucket: "mind-bridge-7b156.firebasestorage.app",
  messagingSenderId: "304970317064",
  appId: "1:304970317064:web:b9c813de4eb1d571ce80bd"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/favicon.svg'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});

/*
  Firebase Messaging SW for web push notifications.
  Note: To receive background notifications, configure FCM and send notifications from server/Console.
*/

importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

// Load config generated at build time (for Docker builds)
// For local dev, you can manually create public/firebase-config-sw.js with the same shape
try { importScripts('/firebase-config-sw.js'); } catch (e) { /* optional */ }

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

try {
  if (self.FIREBASE_SW_CONFIG && self.FIREBASE_SW_CONFIG.apiKey) {
    firebase.initializeApp(self.FIREBASE_SW_CONFIG);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      self.registration.showNotification(title || 'Lynq', {
        body: body || 'New message',
        icon: '/icon.png'
      });
    });
  } else {
    // No config present; background notifications will be disabled in SW
    // Foreground notifications via onMessage in the app still work if messaging is supported
  }
} catch (e) {
  // Fail gracefully; do not break SW lifecycle
}

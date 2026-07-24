/* ESON × UNISON Calendar Firebase Messaging Service Worker
   v29 */

// Keep this handler before the Firebase imports so notification taps always
// use the calendar's own navigation behavior.
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const rawTarget = event.notification?.data?.url || './';
  const targetUrl = new URL(rawTarget, self.location.origin);
  targetUrl.searchParams.set('open', 'today');

  event.waitUntil((async () => {
    const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existingClient = windowClients.find(client => client.url.startsWith(self.registration.scope));

    if (existingClient) {
      if ('navigate' in existingClient) await existingClient.navigate(targetUrl.href);
      return existingClient.focus();
    }

    return clients.openWindow(targetUrl.href);
  })());
});

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB-zKGQ4NNNnRh-BMep97o66iSR7juKVoY',
  authDomain: 'eson-unison-calendar-cd2f9.firebaseapp.com',
  projectId: 'eson-unison-calendar-cd2f9',
  storageBucket: 'eson-unison-calendar-cd2f9.firebasestorage.app',
  messagingSenderId: '672800291334',
  appId: '1:672800291334:web:818338c46b659531bfe187',
  measurementId: 'G-XDER4CP7WP'
});

try {
  firebase.messaging();
} catch (error) {
  console.error('[SW] Firebase Messaging init failed:', error);
}

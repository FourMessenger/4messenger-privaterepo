// Простой service worker для PWA
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting(); // Активировать сразу
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim()); // Взять под контроль все вкладки
});

self.addEventListener('fetch', (event) => {
  // Пока просто логируем запросы
  console.log('Fetch:', event.request.url);
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received', event);
  
  if (!event.data) {
    console.warn('[SW] Push event with no data');
    return;
  }

  let notificationData = {};
  try {
    notificationData = event.data.json();
    console.log('[SW] Push notification data:', notificationData);
  } catch (err) {
    console.error('[SW] Failed to parse push data:', err);
    notificationData = {
      title: 'New Notification',
      body: event.data.text()
    };
  }

  const options = {
    body: notificationData.body || '',
    icon: notificationData.icon || '/official.txt',
    badge: notificationData.badge || '/official.txt',
    tag: notificationData.tag || 'default',
    requireInteraction: notificationData.requireInteraction === true,
    data: notificationData.data || {},
    vibrate: [200, 100, 200], // Vibration pattern
    actions: [
      {
        action: 'open',
        title: 'Open',
      },
      {
        action: 'close',
        title: 'Close',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'New Notification',
      options
    ).then(() => {
      console.log('[SW] Notification displayed successfully');
    }).catch(err => {
      console.error('[SW] Failed to show notification:', err);
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  const urlToOpen = event.notification.data.chatId 
    ? `/?chat=${event.notification.data.chatId}`
    : '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

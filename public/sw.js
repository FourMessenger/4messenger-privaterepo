// Service Worker for 4 Messenger
// Enables notifications even when the app tab is closed
// Supports push notifications via Web Push API

const CACHE_NAME = '4messenger-v2';
const NOTIFICATION_TAG = '4messenger-notification';

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Handle push notifications (server sends these even when tab is closed)
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  try {
    let notificationData = {
      title: '4 Messenger',
      options: {
        badge: '/official.txt',
        icon: '/official.txt',
        requireInteraction: false,
      }
    };

    if (event.data) {
      try {
        const data = event.data.json();
        notificationData.title = data.title || '4 Messenger';
        notificationData.options = {
          body: data.body || 'New message',
          badge: data.badge || '/official.txt',
          icon: data.icon || '/official.txt',
          tag: data.tag || NOTIFICATION_TAG,
          data: {
            chatId: data.chatId,
            senderId: data.senderId,
            timestamp: Date.now()
          },
          requireInteraction: data.requireInteraction || false,
        };
      } catch (e) {
        // If not JSON, treat as plain text
        notificationData.options.body = event.data.text();
      }
    }

    event.waitUntil(
      self.registration.showNotification(notificationData.title, notificationData.options)
    );
  } catch (error) {
    console.error('[SW] Failed to handle push event:', error);
  }
});

// Handle push subscription errors
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');
  event.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true })
      .then((subscription) => {
        // Send new subscription to the server
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription })
        });
      })
      .catch((err) => {
        console.error('[SW] Failed to resubscribe to push:', err);
      })
  );
});

// Handle messages from clients (the app)
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SHOW_NOTIFICATION':
      showNotification(data);
      break;
    case 'SUBSCRIBE_TO_PUSH':
      subscribeToPush(event.ports[0]);
      break;
  }
});

// Show notification from client
async function showNotification(data) {
  const { title, options } = data;
  
  try {
    await self.registration.showNotification(title, {
      badge: '/official.txt',
      requireInteraction: false,
      ...options,
    });
  } catch (error) {
    console.error('[SW] Failed to show notification:', error);
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();
  
  const chatId = event.notification.tag;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app is already open
      for (let client of clientList) {
        if (client.url.includes('4messenger') && 'focus' in client) {
          // Post message to set active chat
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            chatId: chatId,
          });
          return client.focus();
        }
      }
      
      // If not open, open it
      if (clients.openWindow) {
        return clients.openWindow('/').then((client) => {
          if (client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              chatId: chatId,
            });
          }
        });
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// Background sync for offline message delivery
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Sync messages with server
async function syncMessages() {
  try {
    const messages = await getAllPendingMessages();
    for (let message of messages) {
      await sendMessageToServer(message);
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Helper functions
async function getAllPendingMessages() {
  // This would be stored in IndexedDB or similar
  return [];
}

async function sendMessageToServer(message) {
  // Implementation would send to server
  console.log('[SW] Sending pending message:', message);
}

// Periodic background sync - check for new messages periodically
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-messages') {
    event.waitUntil(checkForMessages());
  }
});

// Check for new messages from server
async function checkForMessages() {
  try {
    console.log('[SW] Checking for new messages...');
    
    // Get auth token from storage
    const sessions = await getAuthToken();
    if (!sessions) return;
    
    // Wait for clients to notify us via message
    // This is safer than making direct requests from SW
  } catch (error) {
    console.error('[SW] Failed to check messages:', error);
  }
}

// Get stored auth token
async function getAuthToken() {
  try {
    const db = await openIndexedDB();
    const session = await db.get('session', 'current');
    return session;
  } catch (error) {
    console.error('[SW] Failed to get auth token:', error);
    return null;
  }
}

// IndexedDB helper
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('4messenger', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('session')) {
        db.createObjectStore('session');
      }
    };
  });
}

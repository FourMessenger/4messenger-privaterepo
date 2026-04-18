// ==================== КОНФИГУРАЦИЯ ====================
const CACHE_NAME = 'pwa-cache-v1';
const OFFLINE_URL = '/offline.html';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html'
];

// ==================== УСТАНОВКА ====================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[SW] Caching files:', STATIC_ASSETS);
        await cache.addAll(STATIC_ASSETS);
        console.log('[SW] Cache complete');
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Install failed:', err);
      })
  );
});

// ==================== АКТИВАЦИЯ ====================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then(async (cacheNames) => {
      for (const cacheName of cacheNames) {
        if (cacheName !== CACHE_NAME) {
          console.log('[SW] Deleting old cache:', cacheName);
          await caches.delete(cacheName);
        }
      }
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// ==================== ОБРАБОТКА ЗАПРОСОВ ====================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  console.log('[SW] Fetch:', event.request.method, url.pathname);
  
  // Пропускаем API
  if (url.pathname.startsWith('/api/')) {
    console.log('[SW] Skip API:', url.pathname);
    return;
  }
  
  // Пропускаем не-GET
  if (event.request.method !== 'GET') {
    console.log('[SW] Skip non-GET:', event.request.method);
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Пытаемся загрузить из сети
        console.log('[SW] Trying network for:', url.pathname);
        const networkResponse = await fetch(event.request);
        
        if (networkResponse && networkResponse.status === 200) {
          console.log('[SW] Network success, caching:', url.pathname);
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
        
      } catch (error) {
        console.log('[SW] Network FAILED for:', url.pathname, error.message);
        
        // Пытаемся взять из кэша
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          console.log('[SW] Cache HIT for:', url.pathname);
          return cachedResponse;
        }
        
        console.log('[SW] Cache MISS for:', url.pathname);
        
        // Если это навигация (переход по странице) - показываем offline.html
        if (event.request.mode === 'navigate') {
          console.log('[SW] Navigation - returning offline.html');
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) {
            return offlinePage;
          }
          return new Response('Offline - no connection', { status: 503 });
        }
        
        // Для всего остального - ошибка
        return new Response('Offline', { status: 503 });
      }
    })()
  );
});

// ==================== PUSH ====================
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  if (!event.data) return;

  let notificationData = {};
  try {
    notificationData = event.data.json();
  } catch (err) {
    notificationData = { title: 'Новое уведомление', body: event.data.text() };
  }

  const options = {
    body: notificationData.body || '',
    icon: notificationData.icon || '/official.txt',
    badge: notificationData.badge || '/official.txt',
    tag: notificationData.tag || 'default',
    data: { url: notificationData.url || '/', chatId: notificationData.chatId },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'close', title: 'Закрыть' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'Новое уведомление', options)
  );
});

// ==================== КЛИК ПО УВЕДОМЛЕНИЮ ====================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  let url = event.notification.data?.url || '/';
  if (event.notification.data?.chatId) {
    url = `/?chat=${event.notification.data.chatId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ==================== СООБЩЕНИЯ ====================
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

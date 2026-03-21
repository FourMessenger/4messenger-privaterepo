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

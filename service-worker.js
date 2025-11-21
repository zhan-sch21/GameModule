// Simple service worker that doesn't cache anything
self.addEventListener('install', function(event) {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  // Just pass through all requests without caching
  event.respondWith(fetch(event.request));
});
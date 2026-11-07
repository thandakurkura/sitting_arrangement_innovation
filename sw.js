/**
 * Lumora × Starfield Autonomous Exam-Management Platform
 * Phase 7: Production Service Worker (PWA Offline-First Engine)
 * Engineering Standard: FAANG Production Baseline
 */

const CACHE_NAME = 'lumora-exam-v1.1.0';

const PRECACHE_RESOURCES = [
  './',
  './index.html',
  './manifest.json',
  './src/prng.js',
  './src/data.js',
  './src/qr.js',
  './src/solver.js',
  './src/outputs.js',
  './src/ai.js',
  './src/scale.js',
  './src/storage.js',
  './src/worker.js',
  './src/worker-client.js',
  './src/tests.js'
];

// Install: Precache all offline critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_RESOURCES);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Purge older cache generations
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate with Cache-First Fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Handle same-origin static assets
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          }).catch(() => {
            // Ignore offline network errors during background refresh
          });
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // Offline fallback
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
    );
  }
});

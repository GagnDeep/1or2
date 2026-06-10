const CACHE_NAME = '1or2-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/router.js',
  '/js/store.js',
  '/js/codec.js',
  '/js/utils.js',
  '/js/components/home.js',
  '/js/components/decks.js',
  '/js/components/create.js',
  '/js/components/play.js',
  '/js/components/mine.js',
  '/data/matchups.json',
  '/icon.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Use cache-first strategy for everything (this is a simple static site)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(networkResponse => {
          // Optional: cache the newly fetched response
          return networkResponse;
        });
      })
  );
});

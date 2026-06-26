/* FHY Priority App — Service Worker
   v2025-06-27-1
   Bump CACHE_VERSION every time you push real changes if you ever
   notice staleness again — it forces old caches to be thrown away. */

const CACHE_VERSION = 'fhy-cache-v2025-06-27-1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png'
];

/* ---- INSTALL: pre-cache the shell, then activate immediately ---- */
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => {
            /* ignore files that don't exist (e.g. missing icon) */
          })
        )
      );
    })
  );
});

/* ---- ACTIVATE: delete every cache that isn't the current version ---- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---- FETCH ----
   Network-first for everything: always try to get the freshest
   file from the server. Only fall back to cache if offline.
   This is what fixes "ayaw mag-update" — no more stuck old files. */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((networkResponse) => {
        const copy = networkResponse.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

/* ---- MESSAGE: allow the page to force-activate a new SW right away ---- */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

const CACHE_NAME = 'ofa-7-1-1-final';
const FILES = [
  './',
  './index.html?v=7.1.1',
  './style.css?v=7.1.1',
  './ofa-7.1.1.css?v=7.1.1',
  './app.js?v=7.1.1',
  './ofa-7.1.1.js?v=7.1.1',
  './firebase-config.js?v=7.1.1',
  './manifest.json?v=7.1.1',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png',
  './assets/lighthouse-clean.png',
  './assets/lighthouse-home.png',
  './assets/splash-background.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES).catch(() => undefined)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const local = url.origin === location.origin;
  const isAppShell = local && (
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/app.js') ||
    url.pathname.endsWith('/ofa-7.1.1.js') ||
    url.pathname.endsWith('/style.css') ||
    url.pathname.endsWith('/ofa-7.1.1.css') ||
    url.pathname.endsWith('/firebase-config.js') ||
    url.pathname.endsWith('/manifest.json')
  );

  if (isAppShell) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html?v=7.1.1') || caches.match('./')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (local) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => undefined);
      }
      return response;
    }).catch(() => cached))
  );
});

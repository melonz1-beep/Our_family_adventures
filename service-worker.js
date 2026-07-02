const CACHE = 'ofa-6-4-8-core-only';
const CORE_FILES = [
  './',
  './index.html',
  './style.css?v=6.4.8',
  './app.js?v=6.4.8',
  './final-6.4.1.css?v=6.4.8',
  './final-6.4.1-patch.js?v=6.4.8',
  './firebase-config.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE_FILES)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => {
      // Remove all older OFA caches so Android/Chrome app storage stops filling up.
      if (key !== CACHE && (key.startsWith('ofa-') || key.includes('our-family-adventures'))) {
        return caches.delete(key);
      }
      return Promise.resolve();
    }))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isImage = event.request.destination === 'image' || /\.(png|jpe?g|gif|webp|svg)$/i.test(url.pathname);
  const isFirebase = url.hostname.includes('firebase') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic');

  // Do not store uploaded photos, Firebase responses, or large image assets in Cache Storage.
  if (isImage || isFirebase) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // Network-first for app files; fallback to the small core cache offline.
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.ok && url.origin === location.origin) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

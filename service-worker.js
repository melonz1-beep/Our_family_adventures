const CACHE_NAME = 'our-family-adventures-v6-2-9';
const ASSETS = [
  './', './index.html?v=6.2.9', './style.css?v=6.2.9', './app.js?v=6.2.9',
  './firebase-config.js?v=6.2.9', './manifest.json?v=6.2.9',
  './assets/lighthouse-home.jpg?v=6.2.9', './assets/splash-background.jpg?v=6.2.9',
  './icons/icon-192.png?v=6.2.9', './icons/icon-512.png?v=6.2.9', './icons/apple-touch-icon.png?v=6.2.9'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin.includes('firebase') || url.origin.includes('googleapis') || url.hostname.includes('open-meteo') || url.hostname.includes('cdnjs')) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(res => {
      const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put('./index.html?v=6.2.9', copy)); return res;
    }).catch(() => caches.match('./index.html?v=6.2.9')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
    const copy = res.clone(); caches.open(CACHE_NAME).then(c => c.put(event.request, copy)); return res;
  })));
});

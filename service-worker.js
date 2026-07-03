const CACHE_NAME = 'ofa-6-5-1-core';
const FILES = [
  './',
  './index.html',
  './style.css?v=6.5.1',
  './final-6.4.1.css?v=6.5.1',
  './ofa-6.5.0.css?v=6.5.1',
  './ofa-6.5.1.css?v=6.5.1',
  './app.js?v=6.5.1',
  './final-6.4.1-patch.js?v=6.5.1',
  './ofa-6.5.0.js?v=6.5.1',
  './ofa-6.5.1.js?v=6.5.1',
  './firebase-config.js?v=6.5.1',
  './manifest.json',
  './assets/lighthouse-clean-360.png',
  './assets/lighthouse-clean-400.png',
  './assets/lighthouse-clean-430.png',
  './assets/lighthouse-clean.png',
  './assets/lighthouse-home.png',
  './assets/splash-background.png',
  './icons/favicon.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k === CACHE_NAME ? null : caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(resp => {
    const copy = resp.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(()=>{});
    return resp;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
});
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

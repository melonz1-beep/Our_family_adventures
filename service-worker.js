const CACHE = 'ofa-6-3-1-final';
const FILES = [
  './',
  './index.html',
  './style.css?v=6.4.0-final',
  './app.js?v=6.3.6-final',
  './firebase-config.js',
  './manifest.json',
  './assets/splash-background.png',
  './assets/lighthouse-home.png',
  './assets/lighthouse-clean.png',
  './assets/lighthouse-clean-400.png',
  './assets/lighthouse-clean-360.png',
  './assets/lighthouse-clean-430.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png'
];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(()=>{});
    return response;
  }).catch(() => caches.match(event.request)));
});

const CACHE = 'ofa-v5-lighthouse-5-0-5';
const FILES = [
  './',
  './index.html',
  './style.css?v=5.0.3',
  './app.js?v=5.0.3',
  './firebase-config.js',
  './manifest.json',
  './assets/splash-background.png',
  './assets/lighthouse-home.png',
  './assets/lighthouse-clean.png',
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

const CACHE_NAME = 'ofa-v7-0-0';
const APP_SHELL = [
  './','./index.html?v=7.0.0','./style.css?v=7.0.0','./app.js?v=7.0.0','./firebase-config.js?v=7.0.0','./manifest.json?v=7.0.0',
  './assets/lighthouse-home.png','./assets/lighthouse-clean.png','./assets/splash-background.png','./icons/icon-192.png','./icons/icon-512.png','./icons/favicon.png'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
    const copy = res.clone();
    if (new URL(e.request.url).origin === location.origin) caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
    return res;
  }).catch(() => caches.match('./index.html?v=7.0.0'))));
});
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {title:'Our Family Adventures', body:'New family update'};
  e.waitUntil(self.registration.showNotification(data.title || 'Our Family Adventures', {body:data.body || 'New update', icon:'icons/icon-192.png', badge:'icons/icon-192.png'}));
});

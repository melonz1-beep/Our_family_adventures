const CACHE='our-family-adventures-first-light-v1';
const FILES=['./','./index.html','./style.css','./app.js','./manifest.json','./assets/lighthouse-home.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('fetch',event=>event.respondWith(caches.match(event.request).then(res=>res||fetch(event.request))));

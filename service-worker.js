const CACHE_NAME='ofa-8-1-0';
const FILES=['./','./index.html?v=8.1.0','./style.css?v=8.1.0','./app.js?v=8.1.0','./manifest.json?v=8.1.0','./firebase-config.js?v=8.1.0','./assets/splash-background.png','./assets/lighthouse-home.png','./assets/lighthouse-clean.png','./icons/favicon.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html?v=8.1.0'))));});

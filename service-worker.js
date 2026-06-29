const CACHE_NAME='ofa-v6-1-1-cache';
const FILES=['./','./index.html','./style.css?v=6.1.1','./app.js?v=6.1.1','./firebase-config.js?v=6.1.1','./manifest.json?v=6.1.1','./assets/lighthouse-home.svg','./assets/splash-background.svg','./icons/icon-192.svg','./icons/icon-512.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{const copy=res.clone();if(new URL(e.request.url).origin===location.origin)caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));return res}).catch(()=>cached)))})

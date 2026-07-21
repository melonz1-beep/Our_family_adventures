/* Our Family Adventures 10.3.10 PWA cache worker. Push is handled by firebase-messaging-sw.js. */
const CACHE='ofa-10-3-10';
const OFFLINE='./index.html?v=10.3.10';
const CORE=['./','./index.html?v=10.3.10','./404.html','./style.css?v=10.3.10','./scrapbook-studio-2.css?v=10.3.10','./app.js?v=10.3.10','./scrapbook-studio-2.js?v=10.3.10','./manifest.json?v=10.3.10','./firebase-config.js?v=10.3.10','./assets/lighthouse-home.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin){event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));return}
 if(event.request.mode==='navigate'){
   event.respondWith(fetch(event.request,{cache:'no-store'}).then(async r=>{if(r.ok)(await caches.open(CACHE)).put(OFFLINE,r.clone());return r}).catch(()=>caches.match(OFFLINE)));return
 }
 event.respondWith(caches.match(event.request).then(cached=>{
   const network=fetch(event.request,{cache:'no-store'}).then(async r=>{if(r.ok)(await caches.open(CACHE)).put(event.request,r.clone());return r});
   return cached||network;
 }));
});
self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
 if(event.data?.type==='CLEAR_OLD_CACHES')event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
 if(event.data?.type==='BADGE_COUNT'){const n=Number(event.data.count)||0;if(self.registration.setAppBadge)n?self.registration.setAppBadge(n):self.registration.clearAppBadge()}
});
self.addEventListener('pushsubscriptionchange',event=>{event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>Promise.all(list.map(c=>c.postMessage({type:'FCM_TOKEN_REFRESH_REQUIRED'})))))});

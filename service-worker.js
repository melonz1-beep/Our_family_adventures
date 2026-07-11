const CACHE='ofa-9-1-8';
const OFFLINE='./index.html?v=9.1.8';
const CORE=['./','./index.html?v=9.1.8','./404.html','./style.css?v=9.1.8','./manifest.json?v=9.1.8','./firebase-config.js?v=9.1.8','./assets/lighthouse-home.png','./icons/icon-192.png','./icons/icon-512.png','./icons/badge-96.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()).then(()=>self.clients.matchAll({includeUncontrolled:true,type:'window'})).then(list=>list.forEach(c=>c.postMessage({type:'OFA_UPDATED',version:'9.1.8'})))));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin){event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));return}
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(async r=>{if(r.ok){const c=await caches.open(CACHE);await c.put(OFFLINE,r.clone())}return r}).catch(async()=>await caches.match(OFFLINE)||await caches.match('./index.html?v=9.1.8')));return;
 }
 event.respondWith(fetch(event.request,{cache:'no-store'}).then(async r=>{if(r.ok){const c=await caches.open(CACHE);c.put(event.request,r.clone())}return r}).catch(()=>caches.match(event.request)));
});
self.addEventListener('push',event=>{let d={};try{d=event.data?event.data.json():{}}catch(_){d={body:event.data?.text()||'Family adventure update'}}event.waitUntil(self.registration.showNotification(d.title||'Our Family Adventures',{body:d.body||'You have a new family update.',icon:'./icons/icon-192.png',badge:'./icons/badge-96.png',tag:d.tag||'ofa-push',renotify:true,data:{url:d.url||'./index.html?v=9.1.8#notifications'}}))});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{const url=event.notification.data?.url||'./index.html?v=9.1.8#notifications';for(const c of list){if('focus'in c){c.navigate(url);return c.focus()}}return clients.openWindow(url)}))});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();if(event.data?.type==='BADGE_COUNT'){const n=Number(event.data.count)||0;if(self.registration.setAppBadge)n?self.registration.setAppBadge(n):self.registration.clearAppBadge()}});

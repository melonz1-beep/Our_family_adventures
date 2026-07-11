/* Firebase Messaging must be initialized inside the active service worker so FCM can
   create and refresh browser registration tokens and receive background messages. */
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');
  firebase.initializeApp({
    apiKey: 'AIzaSyCr4mRHzubFblqpdiaBB4lYWwF9TPc4C2g',
    authDomain: 'our-family-adventures.firebaseapp.com',
    databaseURL: 'https://our-family-adventures-default-rtdb.firebaseio.com',
    projectId: 'our-family-adventures',
    storageBucket: 'our-family-adventures.firebasestorage.app',
    messagingSenderId: '283204446220',
    appId: '1:283204446220:web:6dfc7570fbff76dc6fa629'
  });
  const fcmMessaging = firebase.messaging();
  fcmMessaging.onBackgroundMessage(payload => {
    const n = payload.notification || {};
    const d = payload.data || {};
    return self.registration.showNotification(n.title || d.title || 'Our Family Adventures', {
      body: n.body || d.body || 'You have a new family update.',
      icon: n.icon || './icons/icon-192.png',
      badge: './icons/badge-96.png',
      tag: d.tag || 'ofa-fcm-background',
      renotify: true,
      data: { url: d.url || './index.html?v=9.4.1#notifications' }
    });
  });
} catch (error) {
  console.error('Firebase Messaging service-worker initialization failed', error);
}

const CACHE='ofa-9-4-1';
const OFFLINE='./index.html?v=9.4.1';
const CORE=['./','./index.html?v=9.4.1','./404.html','./style.css?v=9.4.1','./manifest.json?v=9.4.1','./firebase-config.js?v=9.4.1','./assets/lighthouse-home.png','./icons/icon-192.png','./icons/icon-512.png','./icons/badge-96.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin){event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));return}if(event.request.mode==='navigate'){event.respondWith(fetch(event.request,{cache:'no-store'}).then(async r=>{if(r.ok)(await caches.open(CACHE)).put(OFFLINE,r.clone());return r}).catch(()=>caches.match(OFFLINE)));return}event.respondWith(fetch(event.request,{cache:'no-store'}).then(async r=>{if(r.ok)(await caches.open(CACHE)).put(event.request,r.clone());return r}).catch(()=>caches.match(event.request)))});
self.addEventListener('push',event=>{let d={};try{d=event.data?event.data.json():{}}catch(_){d={body:event.data?.text()||'Family adventure update'}}const n=d.notification||d;event.waitUntil(self.registration.showNotification(n.title||'Our Family Adventures',{body:n.body||d.data?.body||'You have a new family update.',icon:n.icon||'./icons/icon-192.png',badge:'./icons/badge-96.png',tag:d.data?.tag||n.tag||'ofa-push',renotify:true,data:{url:d.data?.url||'./index.html?v=9.4.1#notifications'}}))});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{const url=event.notification.data?.url||'./index.html?v=9.4.1#notifications';for(const c of list){if('focus'in c){c.navigate(url);return c.focus()}}return clients.openWindow(url)}))});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();if(event.data?.type==='BADGE_COUNT'){const n=Number(event.data.count)||0;if(self.registration.setAppBadge)n?self.registration.setAppBadge(n):self.registration.clearAppBadge()}});

self.addEventListener('pushsubscriptionchange',event=>{event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>Promise.all(list.map(c=>c.postMessage({type:'FCM_TOKEN_REFRESH_REQUIRED'}))))) });

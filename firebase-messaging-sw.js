'use strict';
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey:'AIzaSyDnVe8uJJjGkOFJXB_l1dLoLYP7GSivS9s',
  authDomain:'our-family-adventures.firebaseapp.com',
  databaseURL:'https://our-family-adventures-default-rtdb.firebaseio.com',
  projectId:'our-family-adventures',
  storageBucket:'our-family-adventures.firebasestorage.app',
  messagingSenderId:'283204446220',
  appId:'1:283204446220:web:7c9f89658312bb282d2df9'
});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
  const n=payload.notification||{},d=payload.data||{};
  return self.registration.showNotification(n.title||d.title||'Our Family Adventures',{
    body:n.body||d.body||'You have a new family update.',
    icon:n.icon||'../icons/icon-192.png',badge:'../icons/badge-96.png',
    tag:d.tag||'ofa-push',renotify:true,data:{url:d.url||'../index.html?v=9.4.1#notifications'}
  });
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||'../index.html?v=9.4.1#notifications',self.location.href).href;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if('focus'in c){c.navigate(target);return c.focus()}}
    return clients.openWindow(target);
  }));
});
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});

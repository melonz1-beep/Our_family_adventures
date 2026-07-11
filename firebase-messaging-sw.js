'use strict';

/*
 * Our Family Adventures — dedicated Firebase Cloud Messaging worker.
 *
 * This worker intentionally has no Firebase SDK imports. The app passes this
 * active registration to firebase.messaging().getToken(), which creates the
 * PushSubscription. Keeping the worker dependency-free prevents SDK/import
 * failures from stopping registration on GitHub Pages.
 */

const APP_VERSION = '9.4.4';
const APP_ROOT = new URL('./', self.location.href);
const DEFAULT_URL = new URL(`index.html?v=${APP_VERSION}#notifications`, APP_ROOT).href;
const ICON_URL = new URL('icons/icon-192.png', APP_ROOT).href;
const BADGE_URL = new URL('icons/badge-96.png', APP_ROOT).href;

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || payload.title || 'Our Family Adventures';
  const targetUrl = data.url || notification.click_action || payload.url || DEFAULT_URL;

  event.waitUntil(self.registration.showNotification(title, {
    body: notification.body || data.body || payload.body || 'You have a new family update.',
    icon: notification.icon || data.icon || ICON_URL,
    badge: notification.badge || data.badge || BADGE_URL,
    tag: data.tag || notification.tag || 'ofa-family-update',
    renotify: true,
    data: { url: new URL(targetUrl, APP_ROOT).href }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification?.data?.url || DEFAULT_URL;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('navigate' in client) await client.navigate(target);
      if ('focus' in client) return client.focus();
    }
    return self.clients.openWindow(target);
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

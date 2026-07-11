'use strict';

const { onValueCreated } = require('firebase-functions/v2/database');
const { logger } = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const MAX_TARGETS = 100;
const MAX_TOKENS_PER_SEND = 500;
const APP_URL = 'https://melonz1-beep.github.io/Our_family_adventures/index.html?v=9.4.4#notifications';
const ICON_URL = 'https://melonz1-beep.github.io/Our_family_adventures/icons/icon-192.png';
const BADGE_URL = 'https://melonz1-beep.github.io/Our_family_adventures/icons/badge-96.png';
const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered'
]);

function targetUids(value) {
  if (Array.isArray(value)) return value.filter(Boolean).slice(0, MAX_TARGETS);
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).filter(([, allowed]) => allowed === true).map(([uid]) => uid).slice(0, MAX_TARGETS);
}

function tokenRecords(uid, devices) {
  if (!devices || typeof devices !== 'object') return [];
  return Object.entries(devices).flatMap(([deviceId, record]) => {
    if (!record || record.active === false || typeof record.token !== 'string' || !record.token.trim()) return [];
    return [{ uid, deviceId, token: record.token.trim() }];
  });
}

exports.sendQueuedFamilyNotification = onValueCreated(
  {
    ref: '/families/{familyId}/notificationQueue/{queueId}',
    instance: 'our-family-adventures-default-rtdb',
    region: 'us-central1',
    retry: false
  },
  async (event) => {
    const familyId = event.params.familyId;
    const queueId = event.params.queueId;
    const item = event.data.val() || {};
    const targets = targetUids(item.targets);
    const db = getDatabase();
    const queueRef = event.data.ref;

    if (!item.actorUid || !targets.length || typeof item.text !== 'string') {
      await queueRef.update({ status: 'rejected', error: 'Invalid notification payload', processedAt: Date.now() });
      return;
    }

    const title = String(item.title || 'Our Family Adventures').slice(0, 100);
    const body = String(item.text || 'You have a new family update.').slice(0, 500);
    const targetUrl = String(item.url || APP_URL);
    const notificationUpdates = {};
    const records = [];

    for (const uid of targets) {
      if (uid !== item.skipInAppFor) {
        notificationUpdates[`families/${familyId}/userNotifications/${uid}/${queueId}`] = {
          id: queueId,
          text: body,
          title,
          at: Date.now(),
          read: false,
          user: uid,
          actorUid: item.actorUid,
          actorName: item.actorName || '',
          kind: item.kind || 'general',
          tripId: item.tripId || '',
          url: targetUrl,
          deliveredBy: 'fcm-sender-9.4.4'
        };
      }
      const tokenSnap = await db.ref(`families/${familyId}/pushTokens/${uid}`).get();
      records.push(...tokenRecords(uid, tokenSnap.val()));
    }

    if (Object.keys(notificationUpdates).length) await db.ref().update(notificationUpdates);

    if (!records.length) {
      await queueRef.update({ status: 'no-registered-devices', targetCount: targets.length, tokenCount: 0, processedAt: Date.now() });
      return;
    }

    let successCount = 0;
    let failureCount = 0;
    const invalidUpdates = {};

    for (let start = 0; start < records.length; start += MAX_TOKENS_PER_SEND) {
      const batch = records.slice(start, start + MAX_TOKENS_PER_SEND);
      const response = await getMessaging().sendEachForMulticast({
        tokens: batch.map(record => record.token),
        notification: { title, body },
        data: {
          title,
          body,
          url: targetUrl,
          tag: `ofa-${item.kind || 'update'}-${queueId}`,
          kind: String(item.kind || 'general'),
          tripId: String(item.tripId || ''),
          notificationId: queueId
        },
        webpush: {
          notification: {
            icon: ICON_URL,
            badge: BADGE_URL,
            tag: `ofa-${item.kind || 'update'}-${queueId}`,
            renotify: true
          },
          fcmOptions: { link: targetUrl }
        }
      });

      successCount += response.successCount;
      failureCount += response.failureCount;
      response.responses.forEach((result, index) => {
        if (result.success) return;
        const code = result.error?.code || '';
        const record = batch[index];
        logger.warn('FCM delivery failed', { familyId, queueId, uid: record.uid, deviceId: record.deviceId, code });
        if (INVALID_TOKEN_CODES.has(code)) invalidUpdates[`families/${familyId}/pushTokens/${record.uid}/${record.deviceId}`] = null;
      });
    }

    if (Object.keys(invalidUpdates).length) await db.ref().update(invalidUpdates);
    await queueRef.update({
      status: failureCount ? (successCount ? 'partially-sent' : 'failed') : 'sent',
      targetCount: targets.length,
      tokenCount: records.length,
      successCount,
      failureCount,
      processedAt: Date.now()
    });
  }
);

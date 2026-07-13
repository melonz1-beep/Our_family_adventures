'use strict';

const { onValueCreated } = require('firebase-functions/v2/database');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const MAX_TARGETS = 100;
const MAX_TOKENS_PER_SEND = 500;
const APP_URL = 'https://melonz1-beep.github.io/Our_family_adventures/index.html?v=10.0.5#notifications';
const DEFAULT_ICON_URL = 'https://melonz1-beep.github.io/Our_family_adventures/icons/icon-192.png';
const DEFAULT_BADGE_URL = 'https://melonz1-beep.github.io/Our_family_adventures/icons/badge-96.png';
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
    let iconUrl = DEFAULT_ICON_URL, badgeUrl = DEFAULT_BADGE_URL;
    try { const base = new URL(targetUrl); iconUrl = new URL('icons/icon-192.png', base).href; badgeUrl = new URL('icons/badge-96.png', base).href; } catch (_) {}
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
          deliveredBy: 'fcm-sender-10.0.5'
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
            icon: iconUrl,
            badge: badgeUrl,
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


function normalizeRows(value) {
  if (!value || typeof value !== 'object') return [];
  return Array.isArray(value) ? value.filter(Boolean) : Object.values(value).filter(Boolean);
}

function validUid(value) {
  return typeof value === 'string' && value.length >= 20 && !value.includes('@');
}

function tripStartDate(trip) {
  const raw = String(trip?.start || trip?.arrival || trip?.arrivalDate || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
}

function sevenDaysFromTodayUtc() {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

function friendlyRange(trip) {
  const start = tripStartDate(trip);
  const end = String(trip?.end || trip?.departure || trip?.departureDate || '').slice(0, 10);
  const fmt = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    return new Date(value + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  };
  return end && end !== start ? `${fmt(start)}–${fmt(end)}` : fmt(start);
}

exports.queueSevenDayTripReminders = onSchedule(
  {
    schedule: 'every day 09:00',
    timeZone: 'America/New_York',
    region: 'us-central1',
    retryCount: 1
  },
  async () => {
    const db = getDatabase();
    const familiesSnap = await db.ref('families').get();
    const families = familiesSnap.val() || {};
    const targetDate = sevenDaysFromTodayUtc();
    const updates = {};

    for (const [familyId, family] of Object.entries(families)) {
      if (!family || typeof family !== 'object') continue;
      const people = normalizeRows(family.publicData?.people);
      const allFamilyUids = [...new Set(people.map(person => person?.owner || person?.uid || person?.firebaseUid).filter(validUid))];
      const tripGroups = [
        ['family', family.familyTrips || {}],
        ['private', family.privateTrips || {}]
      ];

      for (const [privacy, bundles] of tripGroups) {
        for (const [tripId, bundle] of Object.entries(bundles || {})) {
          const trip = bundle?.trip || bundle;
          if (!trip || tripStartDate(trip) !== targetDate) continue;
          const reminderId = `trip-reminder-${String(tripId).replace(/[^a-zA-Z0-9_-]/g, '')}-${targetDate}`;
          if (family.notificationQueue?.[reminderId] || family.reminderLog?.[reminderId]) continue;

          let targets = allFamilyUids;
          if (privacy === 'private') {
            targets = Object.entries(family.tripMembers?.[tripId] || {}).filter(([, allowed]) => allowed === true).map(([uid]) => uid).filter(validUid);
          }
          if (!targets.length) continue;

          const name = String(trip.name || 'Your trip');
          const dates = friendlyRange(trip);
          updates[`families/${familyId}/notificationQueue/${reminderId}`] = {
            actorUid: 'system-trip-reminder',
            actorName: 'Trip Reminder',
            targets: Object.fromEntries(targets.map(uid => [uid, true])),
            title: `${name} is in 7 days`,
            text: `${name} (${dates}) will be in 7 days.`,
            kind: 'trips',
            tripId: String(tripId),
            url: `https://melonz1-beep.github.io/Our_family_adventures/index.html?v=10.0.5#trip/${encodeURIComponent(tripId)}`,
            createdAt: Date.now(),
            reminderDate: targetDate
          };
          updates[`families/${familyId}/reminderLog/${reminderId}`] = { queuedAt: Date.now(), tripId: String(tripId), targetDate };
        }
      }
    }

    if (Object.keys(updates).length) await db.ref().update(updates);
    logger.info('Seven-day trip reminder scan complete', { targetDate, queued: Object.keys(updates).filter(key => key.includes('/notificationQueue/')).length });
  }
);

'use strict';

const { onValueCreated } = require('firebase-functions/v2/database');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const { getMessaging } = require('firebase-admin/messaging');
const { getAuth } = require('firebase-admin/auth');

initializeApp();

const MAX_TARGETS = 100;
const MAX_TOKENS_PER_SEND = 500;
const APP_URL = 'https://melonz1-beep.github.io/Our_family_adventures/index.html?v=10.3.8#notifications';
const DEFAULT_ICON_URL = 'https://melonz1-beep.github.io/Our_family_adventures/icons/icon-192.png';
const DEFAULT_BADGE_URL = 'https://melonz1-beep.github.io/Our_family_adventures/icons/badge-96.png';
const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered'
]);

const FAMILY_ROLES = new Set(['Admin', 'Family', 'Guest', 'Child']);

function cleanFamilyId(value) {
  const familyId = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,80}$/.test(familyId)) throw new HttpsError('invalid-argument', 'A valid family workspace is required.');
  return familyId;
}

function cleanInviteCode(value) {
  const code = String(value || '').trim();
  if (!/^[a-zA-Z0-9]{12,128}$/.test(code)) throw new HttpsError('invalid-argument', 'A valid invitation code is required.');
  return code;
}

function cleanRole(value) {
  return FAMILY_ROLES.has(value) ? value : 'Family';
}

function normalizedEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function findInvitation(familyId, inviteId, inviteCode) {
  const db = getDatabase();
  const base = db.ref(`families/${familyId}/pendingInvites`);
  if (inviteId) {
    const direct = await base.child(String(inviteId)).get();
    const value = direct.val();
    if (direct.exists() && String(value?.code || '') === inviteCode) return { key: direct.key, value };
  }
  const found = await base.orderByChild('code').equalTo(inviteCode).limitToFirst(1).get();
  let result = null;
  found.forEach(child => { if (!result) result = { key: child.key, value: child.val() }; });
  return result;
}

async function applyFamilyClaims(uid, familyId, role) {
  const auth = getAuth();
  const user = await auth.getUser(uid);
  await auth.setCustomUserClaims(uid, {
    ...(user.customClaims || {}),
    familyId,
    familyMember: true,
    familyRole: cleanRole(role)
  });
}

exports.lookupFamilyInvite = onCall({ region: 'us-central1', cors: true }, async request => {
  const familyId = cleanFamilyId(request.data?.familyId);
  const inviteCode = cleanInviteCode(request.data?.inviteCode);
  const invitation = await findInvitation(familyId, request.data?.inviteId || '', inviteCode);
  if (!invitation || String(invitation.value?.status || '').toLowerCase() === 'revoked') {
    throw new HttpsError('not-found', 'This invitation is invalid or has been revoked.');
  }
  return {
    id: invitation.key,
    code: inviteCode,
    email: normalizedEmail(invitation.value.email),
    name: String(invitation.value.name || ''),
    role: cleanRole(invitation.value.role),
    status: String(invitation.value.status || 'Pending')
  };
});

exports.authorizeFamilyMember = onCall({ region: 'us-central1', cors: true }, async request => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in before opening the family workspace.');
  const familyId = cleanFamilyId(request.data?.familyId);
  const uid = request.auth.uid;
  const email = normalizedEmail(request.auth.token?.email);
  if (!email) throw new HttpsError('permission-denied', 'An email address is required.');

  const db = getDatabase();
  const familyRef = db.ref(`families/${familyId}`);
  const memberRef = familyRef.child(`familyMembers/${uid}`);
  const memberSnap = await memberRef.get();
  let member = memberSnap.val();
  let inviteKey = '';

  if (member && member.active === false) {
    throw new HttpsError('permission-denied', 'This family membership has been disabled by an administrator.');
  }
  if (!member?.active) {
    const configuredAdminSnap = await familyRef.child('publicData/settings/template/adminEmail').get();
    const legacyAdminSnap = configuredAdminSnap.exists() ? null : await familyRef.child('appData/settings/template/adminEmail').get();
    const configuredAdminEmail = normalizedEmail(configuredAdminSnap.val() || legacyAdminSnap?.val());
    if (configuredAdminEmail && email === configuredAdminEmail) {
      member = { uid, email, name: String(request.auth.token?.name || 'Administrator'), role: 'Admin', active: true, joinedAt: Date.now(), approvedBy: 'secure-admin-bootstrap' };
    } else {
      const inviteCode = cleanInviteCode(request.data?.inviteCode);
      const invitation = await findInvitation(familyId, request.data?.inviteId || '', inviteCode);
      if (!invitation || normalizedEmail(invitation.value?.email) !== email) {
        throw new HttpsError('permission-denied', 'This account is not on the approved family invitation.');
      }
      if (String(invitation.value?.status || '').toLowerCase() === 'revoked') {
        throw new HttpsError('permission-denied', 'This invitation has been revoked.');
      }
      if (invitation.value?.uid && invitation.value.uid !== uid) {
        throw new HttpsError('permission-denied', 'This invitation has already been accepted by another account.');
      }
      inviteKey = invitation.key;
      member = {
        uid,
        email,
        name: String(invitation.value?.name || request.auth.token?.name || 'Family member'),
        role: cleanRole(invitation.value?.role),
        active: true,
        inviteId: inviteKey,
        joinedAt: Date.now(),
        approvedBy: 'family-invitation'
      };
    }
    await memberRef.set(member);
  }

  if (normalizedEmail(member.email) !== email) throw new HttpsError('permission-denied', 'This member record belongs to a different email address.');
  const role = cleanRole(member.role);
  await applyFamilyClaims(uid, familyId, role);
  if (inviteKey) {
    await familyRef.child(`pendingInvites/${inviteKey}`).update({ status: 'Accepted', uid, acceptedAt: Date.now() });
  }
  return { active: true, role, familyId, refreshToken: true };
});

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
          deliveredBy: 'fcm-sender-10.3.8'
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
            url: `https://melonz1-beep.github.io/Our_family_adventures/index.html?v=10.3.8#trip/${encodeURIComponent(tripId)}`,
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

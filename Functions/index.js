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
const APP_URL = 'https://melonz1-beep.github.io/Our_family_adventures/index.html?v=10.3.9#notifications';
const DEFAULT_ICON_URL = 'https://melonz1-beep.github.io/Our_family_adventures/icons/icon-192.png';
const DEFAULT_BADGE_URL = 'https://melonz1-beep.github.io/Our_family_adventures/icons/badge-96.png';
const INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered'
]);

const FAMILY_ROLES = new Set(['Admin', 'Family', 'Guest', 'Child']);
const CLAIMABLE_INVITE_STATUSES = new Set(['pending', 'invitation ready']);
const NOTIFICATION_WINDOW_MS = 60 * 1000;
const NOTIFICATIONS_PER_WINDOW = 10;

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

function maskedEmail(value) {
  const email = normalizedEmail(value);
  const [name = '', domain = ''] = email.split('@');
  if (!name || !domain) return '';
  return `${name.slice(0, 1)}${'*'.repeat(Math.min(Math.max(name.length - 1, 2), 8))}@${domain}`;
}

function isClaimableInvitation(value) {
  return value && CLAIMABLE_INVITE_STATUSES.has(String(value.status || 'Pending').trim().toLowerCase());
}

function canClaimInvitation(value, uid) {
  return isClaimableInvitation(value)
    || (String(value?.status || '').trim().toLowerCase() === 'claiming' && value?.uid === uid);
}

async function activeMember(familyId, uid) {
  const snapshot = await getDatabase().ref(`families/${familyId}/familyMembers/${uid}`).get();
  const member = snapshot.val();
  if (!member?.active) throw new HttpsError('permission-denied', 'This family membership is not active.');
  return member;
}

async function activeAdmin(familyId, uid) {
  const member = await activeMember(familyId, uid);
  if (member.role !== 'Admin') throw new HttpsError('permission-denied', 'Administrator access is required.');
  return member;
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
  if (!invitation || !isClaimableInvitation(invitation.value)) {
    throw new HttpsError('not-found', 'This invitation is invalid or has been revoked.');
  }
  return {
    id: invitation.key,
    emailHint: maskedEmail(invitation.value.email),
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
    if (request.auth.token?.email_verified !== true) {
      throw new HttpsError('failed-precondition', 'Verify your email address before accepting this invitation.');
    }
    const inviteCode = cleanInviteCode(request.data?.inviteCode);
    const invitation = await findInvitation(familyId, request.data?.inviteId || '', inviteCode);
    if (!invitation || normalizedEmail(invitation.value?.email) !== email || !canClaimInvitation(invitation.value, uid)) {
      throw new HttpsError('permission-denied', 'This account is not on an active family invitation.');
    }
    inviteKey = invitation.key;
    const inviteRef = familyRef.child(`pendingInvites/${inviteKey}`);
    const claimed = await inviteRef.transaction(current => {
      if (!current || normalizedEmail(current.email) !== email || !canClaimInvitation(current, uid)) return;
      return { ...current, status: 'Claiming', uid, claimingAt: Date.now() };
    }, undefined, false);
    if (!claimed.committed || claimed.snapshot.val()?.uid !== uid) {
      throw new HttpsError('already-exists', 'This invitation has already been claimed.');
    }
    const claimedInvite = claimed.snapshot.val();
    member = {
      uid,
      email,
      name: String(claimedInvite?.name || request.auth.token?.name || 'Family member'),
      role: cleanRole(claimedInvite?.role),
      active: true,
      inviteId: inviteKey,
      joinedAt: Date.now(),
      approvedBy: 'verified-family-invitation'
    };
    await memberRef.set(member);
  }

  if (normalizedEmail(member.email) !== email) throw new HttpsError('permission-denied', 'This member record belongs to a different email address.');
  const role = cleanRole(member.role);
  await applyFamilyClaims(uid, familyId, role);
  if (role === 'Admin') {
    await familyRef.update({
      'publicData/invites': null,
      'publicData/settings/adminCode': null
    });
  }
  if (inviteKey) {
    await familyRef.child(`pendingInvites/${inviteKey}`).update({ status: 'Accepted', uid, acceptedAt: Date.now() });
  }
  return { active: true, role, familyId, refreshToken: true };
});

exports.updateFamilyMemberRole = onCall({ region: 'us-central1', cors: true }, async request => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in before managing family members.');
  const familyId = cleanFamilyId(request.data?.familyId);
  await activeAdmin(familyId, request.auth.uid);
  if (!FAMILY_ROLES.has(request.data?.role)) throw new HttpsError('invalid-argument', 'Choose a valid family role.');
  const nextRole = request.data.role;
  const familyRef = getDatabase().ref(`families/${familyId}`);
  let targetUid = String(request.data?.targetUid || '').trim();
  const targetEmail = normalizedEmail(request.data?.targetEmail);
  if (!targetUid && targetEmail) {
    const matches = await familyRef.child('familyMembers').orderByChild('email').equalTo(targetEmail).limitToFirst(1).get();
    matches.forEach(child => { if (!targetUid) targetUid = child.key; });
  }
  if (!targetUid) throw new HttpsError('not-found', 'The selected person does not have an accepted account yet.');
  if (!/^[A-Za-z0-9:_-]{1,128}$/.test(targetUid)) throw new HttpsError('invalid-argument', 'The selected account identifier is invalid.');
  let rejection = 'The selected family membership is not active.';
  const membersRef = familyRef.child('familyMembers');
  const updated = await membersRef.transaction(members => {
    if (!members?.[request.auth.uid]?.active || members[request.auth.uid].role !== 'Admin') {
      rejection = 'Administrator access is no longer active.';
      return;
    }
    if (!members || !members[targetUid]?.active) return;
    const target = members[targetUid];
    if (target.role === 'Admin' && nextRole !== 'Admin') {
      const activeAdmins = Object.values(members).filter(value => value?.active && value.role === 'Admin').length;
      if (activeAdmins <= 1) {
        rejection = 'The last active administrator cannot be demoted.';
        return;
      }
    }
    members[targetUid] = { ...target, role: nextRole, roleUpdatedAt: Date.now(), roleUpdatedBy: request.auth.uid };
    return members;
  }, undefined, false);
  if (!updated.committed) throw new HttpsError('failed-precondition', rejection);
  await applyFamilyClaims(targetUid, familyId, nextRole);
  await getAuth().revokeRefreshTokens(targetUid);
  return { updated: true, uid: targetUid, role: nextRole, refreshRequired: targetUid === request.auth.uid };
});

exports.queueFamilyNotification = onCall({ region: 'us-central1', cors: true }, async request => {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in before sending notifications.');
  const familyId = cleanFamilyId(request.data?.familyId);
  const actor = await activeMember(familyId, request.auth.uid);
  const text = String(request.data?.text || '').trim().slice(0, 500);
  if (!text) throw new HttpsError('invalid-argument', 'Notification text is required.');
  const requestedTargets = [...new Set(targetUids(request.data?.targets))];
  if (!requestedTargets.length) throw new HttpsError('invalid-argument', 'At least one notification recipient is required.');
  const db = getDatabase();
  const familyRef = db.ref(`families/${familyId}`);
  const members = (await familyRef.child('familyMembers').get()).val() || {};
  const targets = requestedTargets.filter(uid => members[uid]?.active === true);
  if (!targets.length) throw new HttpsError('permission-denied', 'No active family recipients were selected.');
  const now = Date.now();
  const rateRef = familyRef.child(`notificationRateLimits/${request.auth.uid}`);
  const rate = await rateRef.transaction(current => {
    const start = Number(current?.windowStartedAt || 0);
    const inWindow = now - start < NOTIFICATION_WINDOW_MS;
    const count = inWindow ? Number(current?.count || 0) : 0;
    if (count >= NOTIFICATIONS_PER_WINDOW) return;
    return { windowStartedAt: inWindow ? start : now, count: count + 1 };
  }, undefined, false);
  if (!rate.committed) throw new HttpsError('resource-exhausted', 'Too many notifications were sent. Try again in one minute.');
  const queueRef = familyRef.child('notificationQueue').push();
  const candidateUrl = String(request.data?.url || APP_URL);
  let targetUrl = APP_URL;
  try {
    const parsed = new URL(candidateUrl);
    if (parsed.origin === 'https://melonz1-beep.github.io') targetUrl = parsed.href;
  } catch (_) {}
  await queueRef.set({
    id: queueRef.key,
    actorUid: request.auth.uid,
    actorName: String(actor.name || 'Family member').slice(0, 100),
    targets: Object.fromEntries(targets.map(uid => [uid, true])),
    title: String(request.data?.title || 'Our Family Adventures').slice(0, 100),
    text,
    kind: String(request.data?.kind || 'general').slice(0, 40),
    tripId: String(request.data?.tripId || '').slice(0, 120),
    url: targetUrl,
    createdAt: now,
    skipInAppFor: String(request.data?.skipInAppFor || '').slice(0, 128)
  });
  return { queued: true, queueId: queueRef.key, targetCount: targets.length };
});

function targetUids(value) {
  if (Array.isArray(value)) return value.filter(validUid).slice(0, MAX_TARGETS);
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).filter(([uid, allowed]) => allowed === true && validUid(uid)).map(([uid]) => uid).slice(0, MAX_TARGETS);
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
    let targets = targetUids(item.targets);
    const db = getDatabase();
    const queueRef = event.data.ref;

    if (!item.actorUid || !targets.length || typeof item.text !== 'string') {
      await queueRef.update({ status: 'rejected', error: 'Invalid notification payload', processedAt: Date.now() });
      return;
    }

    const familyRef = db.ref(`families/${familyId}`);
    const members = (await familyRef.child('familyMembers').get()).val() || {};
    if (item.actorUid !== 'system-trip-reminder' && members[item.actorUid]?.active !== true) {
      await queueRef.update({ status: 'rejected', error: 'Inactive notification sender', processedAt: Date.now() });
      return;
    }
    targets = targets.filter(uid => members[uid]?.active === true);
    if (!targets.length) {
      await queueRef.update({ status: 'rejected', error: 'No active recipients', processedAt: Date.now() });
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
          deliveredBy: 'fcm-sender-10.3.9'
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
  return typeof value === 'string' && /^[A-Za-z0-9:_-]{20,128}$/.test(value);
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
            url: `https://melonz1-beep.github.io/Our_family_adventures/index.html?v=10.3.9#trip/${encodeURIComponent(tripId)}`,
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

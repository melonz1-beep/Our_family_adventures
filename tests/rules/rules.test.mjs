import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';

const projectId = 'demo-family-adventures';
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    database: {
      host: '127.0.0.1',
      port: 9000,
      rules: readFileSync(new URL('../../database.rules.json', import.meta.url), 'utf8')
    },
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8')
    },
    storage: {
      host: '127.0.0.1',
      port: 9199,
      rules: readFileSync(new URL('../../storage.rules', import.meta.url), 'utf8')
    }
  });
});

beforeEach(async () => {
  await env.clearDatabase();
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async context => {
    await context.database().ref('families/familyA/familyMembers/admin').set({
      uid: 'admin', email: 'admin@example.test', role: 'Admin', active: true
    });
    await context.database().ref('families/familyA/familyMembers/member').set({
      uid: 'member', email: 'member@example.test', role: 'Family', active: true
    });
    await context.database().ref('families/familyA/familyMembers/inactive').set({
      uid: 'inactive', email: 'inactive@example.test', role: 'Family', active: false
    });
    await context.database().ref('families/familyA/publicData/version').set('10.3.18');
    await context.database().ref('families/familyA/pendingInvites/invite1').set({
      code: 'TESTINVITECODE1234', email: 'invitee@example.test', status: 'Pending'
    });
  });
});

after(async () => {
  await env?.cleanup();
});

const rtdbPath = (context, path) => context.database().ref(path);
const familyClaims = (role = 'Family') => ({
  familyMember: true,
  familyId: 'familyA',
  familyRole: role
});

test('Realtime Database denies unauthenticated and inactive family access', async () => {
  await assertFails(rtdbPath(env.unauthenticatedContext(), 'families/familyA/publicData').once('value'));
  await assertFails(rtdbPath(env.authenticatedContext('inactive'), 'families/familyA/publicData').once('value'));
  await assertFails(rtdbPath(env.authenticatedContext('inactive'), 'families/familyA/publicData/version').set('bad'));
});

test('active members read shared data and only their own membership record', async () => {
  const member = env.authenticatedContext('member');
  assert.equal((await assertSucceeds(rtdbPath(member, 'families/familyA/publicData/version').once('value'))).val(), '10.3.18');
  await assertSucceeds(rtdbPath(member, 'families/familyA/familyMembers/member').once('value'));
  await assertFails(rtdbPath(member, 'families/familyA/familyMembers/admin').once('value'));
  await assertSucceeds(rtdbPath(member, 'families/familyA/publicData/people/person1').set({ name: 'Member' }));
});

test('only active admins manage membership records and invitations', async () => {
  const member = env.authenticatedContext('member');
  const admin = env.authenticatedContext('admin');
  await assertFails(rtdbPath(member, 'families/familyA/familyMembers/newUser').set({
    uid: 'newUser', email: 'new@example.test', role: 'Family', active: true
  }));
  await assertFails(rtdbPath(member, 'families/familyA/pendingInvites').once('value'));
  await assertSucceeds(rtdbPath(admin, 'families/familyA/pendingInvites/invite1').once('value'));
  await assertSucceeds(rtdbPath(admin, 'families/familyA/familyMembers/newUser').set({
    uid: 'newUser', email: 'new@example.test', role: 'Family', active: true
  }));
});

test('Realtime Database trip creation requires an active member to own the trip', async () => {
  const member = env.authenticatedContext('member');
  await assertSucceeds(rtdbPath(member, 'families/familyA/familyTrips/trip1').set({
    trip: { ownerUid: 'member', name: 'Test trip' }
  }));
  await assertFails(rtdbPath(member, 'families/familyA/familyTrips/trip2').set({
    trip: { ownerUid: 'someone-else', name: 'Test trip' }
  }));
});

test('Firestore remains closed to signed-in and unauthenticated clients', async () => {
  await assertFails(env.unauthenticatedContext().firestore().doc('families/familyA/private/docs/privateDoc').get());
  await assertFails(env.authenticatedContext('member').firestore().doc('families/familyA/private/docs/privateDoc').get());
});

test('Storage allows a member to upload their own image only within their family', async () => {
  const member = env.authenticatedContext('member', familyClaims()).storage();
  const otherFamily = env.authenticatedContext('member', {
    ...familyClaims(), familyId: 'familyB'
  }).storage();
  const image = new Uint8Array([137, 80, 78, 71]);
  await assertSucceeds(member.ref('families/familyA/photos/member.png').put(image, {
    contentType: 'image/png', customMetadata: { ownerUid: 'member' }
  }));
  await assertFails(member.ref('families/familyA/photos/other.png').put(image, {
    contentType: 'image/png', customMetadata: { ownerUid: 'someone-else' }
  }));
  await assertFails(otherFamily.ref('families/familyA/photos/cross-family.png').put(image, {
    contentType: 'image/png', customMetadata: { ownerUid: 'member' }
  }));
});

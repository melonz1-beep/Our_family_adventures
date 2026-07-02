# Invite-Only Firebase Security Added

This package adds the recommended invite-only Firebase setup.

## What changed

- Firebase Hosting can still be public, but family data is protected.
- New accounts require an invite code created by the admin.
- Approved users are saved under `/users` and `/families/our-family-adventures/members`.
- Shared app data is saved under `/families/our-family-adventures/private/appData`.
- Firestore rules only allow approved family members to read/write family app data.
- Storage rules only allow approved signed-in users to upload/read family photos and videos.
- Settings now shows an Invite-only security notice.

## Important deploy step

After uploading the app files, also publish the included `firestore.rules` and `storage.rules` in Firebase.

## First admin note

At least one admin account must have role `Admin` or `Owner` and approved `true` in Firestore under `/users/{uid}`.

# Admin Guide — Version 5.0

## Before family launch
1. Enable Firebase Authentication with email/password.
2. Require email verification.
3. Deploy `firestore.rules` and `storage.rules`.
4. Enable App Check.
5. Paste your Firebase config into `firebase-config.js`.
6. Change `window.OFA_FIREBASE_ENABLED` to `true` only after Firebase is configured.
7. Test with one admin account and one invited family account.
8. Download a backup before each major update.

## Roles
Recommended roles: owner, admin, family, guest, child.

## Backups
Use Settings → Download Backup JSON. Keep copies before making major GitHub or Firebase changes.

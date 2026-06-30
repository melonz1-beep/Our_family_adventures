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


## Version 5.0.7 Scrapbook Studio

This update adds working scrapbook layouts: Grid, Feature Photo, Collage, and Freeform. Select multiple photos from Memories, create a page, then drag photos, stickers, and text boxes around the page. Use the gold corner handle to resize. Each page supports frames, backgrounds, movable stickers, movable text boxes, JPEG export, and Print / Save as PDF.

After uploading to GitHub, open the app with `?v=5.0.7` to clear the old cache.

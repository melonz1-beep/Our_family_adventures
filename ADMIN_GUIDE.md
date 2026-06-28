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


## Version 6.0.3 Scrapbook Studio

This update adds working scrapbook layouts: Grid, Feature Photo, Collage, and Freeform. Select multiple photos from Memories, create a page, then drag photos, stickers, and text boxes around the page. Use the gold corner handle to resize. Each page supports frames, backgrounds, movable stickers, movable text boxes, JPEG export, and Print / Save as PDF.

After uploading to GitHub, open the app with `?v=6.0.3` to clear the old cache.

## Version 6.0.3 home/splash image setup
The home page now points to `assets/lighthouse-home.png`.
The splash screen now points to `assets/splash-background.png`.
The app icons now point to the `icons` folder.
If GitHub still shows the old image, open the site once with `?v=6.0.3` or clear the browser cache.


## Version 6.0.3 Fix
This update fixes scrapbook photo saving on phones by compressing local photos, keeps the photo source inside saved scrapbook pages, removes cropped wording from the lighthouse splash/home background, and improves mobile card spacing. Open the app with `?v=6.0.3` after upload.


## Version 6.0.3 fixes
- Moves storage-full messages away from the Begin Our Journey button.
- Adds a clearer Firebase setup message when firebase-config.js still has placeholder values.
- Rebuilds the scrapbook draft editor so selected photos appear, can be rearranged before saving, and support frames, stickers, text boxes, background changes, bring-to-front, delete selected, PDF/print, and JPEG export.
- Improves phone spacing on the splash page, home page, cards, and bottom navigation.

After uploading, open the app with `?v=6.0.3` to clear the old cache.

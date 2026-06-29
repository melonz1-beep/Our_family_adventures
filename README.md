# Our Family Adventures Version 6.1

Upload all files in this folder to the root of your GitHub Pages repository.

## Files
- `index.html`
- `style.css`
- `app.js`
- `firebase-config.js`
- `service-worker.js`
- `manifest.json`
- `assets/`
- `icons/`

## Firebase setup
This version uses your Firebase config in `firebase-config.js` and signs users in anonymously.

In Firebase Console:
1. Go to Authentication > Sign-in method.
2. Enable Anonymous sign-in.
3. Go to Firestore Database and create a database.
4. Go to Storage and enable storage if you later add cloud photo uploads.

## Basic Firestore rules for testing
Use stricter family-only rules before sharing widely.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ofa/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Admin
Admin PIN: 1218

## Notes
Photos are stored in the browser/local saved app data. The core planner data syncs to Firestore. This avoids Firebase Storage CORS issues while keeping the scrapbook working immediately on GitHub Pages.


Important: Upload the CONTENTS of this folder to GitHub Pages, not the parent folder. If you still see an old Firebase message, clear the browser cache/site data or unregister the old service worker because an older cached app is being displayed.

# Our Family Adventures 8.1.0

Deploy all files in this folder to the root of the GitHub Pages repository.

## Fixes in 8.1
- Fixes Firebase initialization order: local save/migration no longer calls Firebase before initializeApp.
- Keeps Melissa opened as Admin on this device.
- Login page initializes Firebase before sign in/create admin login.
- Updates cache to 8.1.0 so Android/iPhone do not keep the old broken file.
- Preserves Version 8 look, routing, CRUD collections, media, scrapbook, lists, admin tools, duplicate prevention, backup/import, 404 routing, and PWA files.

## After upload
1. Commit all files.
2. Open the app in Chrome.
3. Use browser menu > clear site data if it still shows 8.0.1, or uninstall/reinstall the PWA.
4. Go to Login and create/sign in with the admin email.
5. Firebase Authentication must have Email/Password enabled.

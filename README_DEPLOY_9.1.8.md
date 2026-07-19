# Our Family Adventures 9.1.8

Built directly from the uploaded 9.1.7 package. Existing 9.1.7 features and data structures are preserved.

## Fixes
- All app-shell asset versions now consistently use 9.1.8.
- Service-worker cache bumped to `ofa-9-1-8`; old caches are removed on activation.
- Installed PWA start URL is versioned to prevent reopening the 9.1.4 shell.
- Scrapbook Studio is isolated as a full-screen workspace; canvas/photos are clipped and controls remain scrollable.
- Settings text contrast is improved in light and dark themes.
- Notification permission and test-notification handling now report blocked/unsupported states clearly.

## Deploy
Upload every file and folder in this package to the repository root, replacing existing files. Do not upload the ZIP itself as the website. Commit, wait for GitHub Pages/Firebase Hosting to finish, then open the normal site URL once. On Android, close the installed app completely and reopen it. If Android still displays 9.1.4 after the new service worker activates, remove the old installed shortcut/app once and reinstall from the refreshed 9.1.8 page.

True remote push while the app is closed requires a push sender/backend (for example Firebase Cloud Messaging with a VAPID key and server/Cloud Function). This build fixes device permission and local/service-worker test notifications; it does not invent missing server credentials.

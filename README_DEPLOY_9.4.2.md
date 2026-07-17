# Our Family Adventures 9.4.2 — Notification Worker Fix

This release replaces the failing Firebase Messaging service worker with a dependency-free push worker. It removes the mismatched Firebase configuration and duplicate messaging initialization that caused `ServiceWorker script evaluation failed`.

## Deploy
1. Replace every repository file with this package, including `firebase-messaging-sw.js`.
2. Publish `database.rules.json` if the active rules do not already include `pushTokens/$uid` self-read/write access.
3. Wait for GitHub Pages to finish deploying.
4. Open `index.html?v=9.4.2` in Chrome and refresh once.
5. Close and reopen the installed app, sign in, and tap **Retry device registration** if automatic registration has not completed.

Successful registration displays `FCM token: saved`. The record appears at:

`families/default-family/pushTokens/{uid}/{deviceId}`

A server-side sender (Cloud Function/Admin SDK) is still required to deliver remote notifications to stored tokens.

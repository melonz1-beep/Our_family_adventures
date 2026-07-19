# Our Family Adventures 9.3.5 — Completed FCM Device Registration

This release keeps the public VAPID key protected in the app and completes the browser/device registration sequence.

## What changed
- Initializes Firebase Messaging inside the active application service worker.
- Waits for the service worker to install and activate before requesting a token.
- Uses the active service-worker registration in Firebase `getToken()`.
- Retries once with a fresh browser push subscription if an old subscription is invalid.
- Saves and verifies each token at `families/default-family/pushTokens/{uid}/{deviceId}`.
- Records service-worker scope/state, device, user, permission, version, and timestamp.
- Displays the exact Firebase error code and message if registration fails.

## Deploy
1. Replace every repository file with this package.
2. Publish the included `database.rules.json` if your current rules do not already contain `pushTokens`.
3. Open `?v=9.3.5` once in Chrome and then reopen the installed app.
4. Sign in, open Admin > Tools, and tap **Register this device for push**.
5. Confirm the status changes to **FCM token: saved**.

Each user and each device receives a separate FCM token. The shared public VAPID key remains protected in the app. Background delivery to other users still requires a trusted sender such as a Firebase Cloud Function using the Admin SDK.

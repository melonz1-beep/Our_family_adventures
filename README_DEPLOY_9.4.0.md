# Our Family Adventures 9.4.0 — Automatic FCM registration

## Deployment
1. Replace all repository files with this package, including `firebase-messaging-sw.js`.
2. Publish the included `database.rules.json` if your current rules do not include `families/$familyId/pushTokens/$uid` self-write access.
3. Open `?v=9.4.0`, refresh once, then reopen the installed app.
4. Each user signs in and taps **Enable Notifications** once per device. Token generation, refresh, database save, and verification then run automatically.

## Token path
`families/default-family/pushTokens/{uid}/{deviceId}`

The VAPID public key is protected in the application. Each device receives a separate FCM registration token. A trusted sender (Cloud Function/Admin SDK) is still required to deliver remote push messages.

# Our Family Adventures 9.3.5

## Protected FCM public key

The Firebase Web Push public VAPID key is now built into the application and is no longer shown in an editable field. Do not place a Firebase private key in this web app.

Each signed-in user must open Version 9.3.5 on each device and grant notification permission. The app then creates and saves a separate FCM token for that user and device under `families/default-family/pushTokens/{uid}/{deviceId}`.

Deploy every file, open `?v=9.3.5`, sign in, unlock Admin, and tap **Register this device for push**. Other users only need to sign in and enable notifications on their own devices.

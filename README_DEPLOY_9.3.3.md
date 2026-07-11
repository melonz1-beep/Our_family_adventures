# Our Family Adventures 9.3.3

## FCM device registration

This build registers the signed-in device with Firebase Cloud Messaging and verifies that the token was written to:

`families/default-family/pushTokens/{uid}/{deviceId}`

Each device record contains `token`, `email`, `deviceId`, `platform`, `permission`, `updatedAt`, `version`, and `active`.

## Deploy

1. Upload every file and folder to the repository, replacing the prior deployment.
2. Publish the included `database.rules.json`.
3. Open `?v=9.3.3`, sign in, unlock Admin, and open Tools.
4. Paste the public Web Push certificate key and tap **Save key & register this device**.
5. The status must say **FCM token: saved**.
6. In Realtime Database, expand `families/default-family/pushTokens/{your UID}` to verify the device record.

Registration gives Firebase the device address. Remote pushes still require a trusted sender using FCM HTTP v1, Firebase Admin SDK, or a Cloud Function.

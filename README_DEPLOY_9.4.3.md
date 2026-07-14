# Our Family Adventures 9.4.3 — FCM Sender Integration

Version 9.4.3 adds the trusted server-side sender required to turn app notification events into phone push notifications.

## What is included

- Existing FCM registration and per-device token storage.
- A new `notificationQueue` path used by the app.
- A Cloud Function named `sendQueuedFamilyNotification`.
- The function writes each recipient's in-app notification and sends the same event to all active FCM device tokens.
- Invalid or expired tokens are removed automatically.
- Private-trip events target linked invited users when a private trip is open.
- The Admin **Send on-device test notification** action now queues a real FCM push.

## Important billing requirement

Cloud Functions deployment requires the Firebase project to use the Blaze pay-as-you-go plan. Firebase provides usage allowances, but billing must be connected before the function can be deployed.

## Deployment order

1. Upload the website files to GitHub Pages as usual.
2. In Firebase Console, publish the included `database.rules.json`.
3. Deploy the Cloud Function from Firebase Cloud Shell or a computer:

```bash
npm install -g firebase-tools
firebase login
firebase use our-family-adventures
cd functions
npm install
cd ..
firebase deploy --only functions:sendQueuedFamilyNotification
```

The included `.firebaserc` already identifies the project.

## Cloud Shell option

Firebase/Google Cloud Shell can be used in a browser without installing software. Upload the complete 9.4.3 folder or ZIP to Cloud Shell, unzip it, run the commands above, and accept any prompt to enable required APIs.

## Test

1. Open the deployed app with `?v=9.4.3`.
2. Confirm Admin Tools shows `FCM token: saved`.
3. Put the app in the background.
4. Tap **Send on-device test notification**.
5. The queue record should show `status: sent` under:

`families/default-family/notificationQueue`

The phone should display the notification banner. If the queue status says `no-registered-devices`, register the device again. If it says `failed`, open Firebase Functions logs for the exact FCM error.

# Family App Template Version 10.0.0

Version 10 is built from Our Family Adventures 9.4.4 and preserves its trip planning, privacy blocker, roles, invitations, chat, media, scrapbook, lists, PDF export, FCM registration, notification queue, and Cloud Function sender.

## Setup Wizard

1. Deploy the app and Firebase files.
2. Sign in as the primary administrator.
3. Open Admin and unlock it.
4. Open **Version 10 Setup Wizard**.
5. Configure the app name, short name, tagline, home text, Firebase family path, administrator email, colors, optional modules, Firebase public web configuration, and Web Push public key.
6. Save and reload if Firebase project fields changed.

Changing the family path creates a new workspace under `families/<family-id>`. Existing trips are not copied automatically.

## Create another app

Copy this entire repository to a new GitHub repository. Create or select a Firebase project, enable Authentication, Realtime Database, Storage, and Cloud Messaging, then enter its public web configuration in the Setup Wizard. Deploy `database.rules.json` and the function sender.

## Deployment

```bash
cd functions
nvm use 20
npm install --no-audit --no-fund
cd ..
firebase deploy --only database,functions:sendQueuedFamilyNotification
```

Deploy the web files through GitHub Pages or Firebase Hosting. Open `?v=10.0.0` once after deployment.

## Security

Do not place Firebase service-account private keys in the browser app or Setup Wizard. The Firebase web configuration and VAPID public key are public identifiers. Server credentials stay in Firebase/Google Cloud.

# Our Family Adventures 9.3.0

## Invitation workflow

1. Deploy every file in this package.
2. Publish `database.rules.json` in Firebase Realtime Database Rules.
3. Sign in as Admin and open Admin Dashboard.
4. Enter the person’s name, email, and role, then tap **Create & Send Invitation**.
5. Your phone email app opens with the secure invitation link prepared. Tap Send.
6. The recipient opens the link and creates an account with the invited email. Firebase assigns the UID and the app links it automatically.

The web app cannot send email silently by itself. The invitation button opens the configured email app so the administrator can send it. For fully automatic server-sent email, add a Firebase Cloud Function or Trigger Email extension later.

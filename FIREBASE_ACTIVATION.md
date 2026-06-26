# Firebase Activation for Our Family Adventures 5.0

This package now includes Firebase SDK activation for:

- Email/password Firebase Authentication
- Firestore cloud sync for app data
- Firebase Storage uploads for profile photos, memory photos, and memory videos
- Local browser backup fallback when Firebase is not configured or user is not signed in

## Before uploading to GitHub

Open `firebase-config.js` and replace the placeholder values with your real Firebase Web App config.

Keep this line enabled:

```js
window.OFA_FIREBASE_ENABLED = true;
```

## Firebase console setup

1. Go to Firebase Console.
2. Open your project.
3. Add a Web App if you have not already.
4. Copy the Web App config into `firebase-config.js`.
5. Enable Authentication > Sign-in method > Email/Password.
6. Create Firestore Database.
7. Create Storage.
8. Publish the included `firestore.rules`.
9. Publish the included `storage.rules`.
10. Upload the updated files to GitHub.

## How family login works

After the app loads, tap the 👤 button.

- If the email/password already exists, it signs in.
- If the account does not exist, the app asks whether to create it.
- New accounts receive an email verification when Firebase allows it.

## Important note

Existing memories saved only inside the browser may include large base64 photos or videos. New uploads after Firebase sign-in are saved to Firebase Storage and only the download links are saved in Firestore.

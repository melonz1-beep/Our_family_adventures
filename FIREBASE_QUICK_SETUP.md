# Firebase Quick Setup for Our Family Adventures 6.0.3

Your app cannot cloud sync until `firebase-config.js` has your real Firebase Web App config.

1. Open Firebase Console.
2. Open your project.
3. Go to Project settings → General.
4. Under Your apps, choose Web app or create one.
5. Copy the firebaseConfig values.
6. Open `firebase-config.js` in this package.
7. Replace every `PASTE_...` value with the real value.
8. Make sure `window.OFA_FIREBASE_ENABLED = true;` stays true.
9. Enable Authentication → Sign-in method → Email/Password.
10. Enable Firestore Database and Storage.
11. Add your GitHub Pages domain under Authentication → Settings → Authorized domains.
12. Upload all files again to GitHub and open the site with `?v=6.0.3`.

The app now shows a clearer message when Firebase is not connected instead of letting the login button look broken.

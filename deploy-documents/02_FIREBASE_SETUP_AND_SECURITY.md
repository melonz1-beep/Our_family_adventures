# Firebase Setup and Security

## Firebase project
Use the existing project:

```js
window.firebaseConfig = {
  apiKey: "AIzaSyCr4mRHzubFblqpdiaBB4lYWwF9TPc4C2g",
  authDomain: "our-family-adventures.firebaseapp.com",
  databaseURL: "https://our-family-adventures-default-rtdb.firebaseio.com",
  projectId: "our-family-adventures",
  storageBucket: "our-family-adventures.firebasestorage.app",
  messagingSenderId: "283204446220",
  appId: "1:283204446220:web:6dfc7570fbff76dc6fa629",
  measurementId: "G-DDRV34JC2Z"
};
window.OFA_FIREBASE_ENABLED = true;
```

## Required Firebase console settings
Enable:
- Authentication → Anonymous sign-in
- Firestore Database
- Firebase Storage
- Cloud Messaging, if push notifications are implemented

## Rule deployment
Deploy:
- `firestore.rules`
- `storage.rules`

Do not leave Firestore or Storage fully public for production.

## Activity log
The app should log human actions only, such as:
- profile added
- trip created
- vote submitted
- photo uploaded
- checklist item completed

Do not show technical Firebase system messages such as:
- Firebase initialized
- Firebase connected
- Firebase sync complete

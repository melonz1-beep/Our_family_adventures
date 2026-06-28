// Our Family Adventures Version 5.0 Firebase Activation
// 1) Create a Firebase project.
// 2) Enable Authentication > Email/Password.
// 3) Enable Firestore Database.
// 4) Enable Storage.
// 5) Paste your Web App config below.
// 6) Keep window.OFA_FIREBASE_ENABLED = true.

window.firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "our-family-adventures.firebaseapp.com",
  projectId: "our-family-adventures",
  storageBucket: "our-family-adventures.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};

window.OFA_FIREBASE_ENABLED = true;

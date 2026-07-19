// Version 10 reusable app template Firebase configuration.
// The Setup Wizard can save a replacement public web configuration in localStorage.
const OFA_DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCr4mRHzubFblqpdiaBB4lYWwF9TPc4C2g",
  authDomain: "our-family-adventures.firebaseapp.com",
  databaseURL: "https://our-family-adventures-default-rtdb.firebaseio.com",
  projectId: "our-family-adventures",
  storageBucket: "our-family-adventures.firebasestorage.app",
  messagingSenderId: "283204446220",
  appId: "1:283204446220:web:6dfc7570fbff76dc6fa629",
  measurementId: "G-DDRV34JC2Z"
};
let OFA_SAVED_FIREBASE_CONFIG = null;
try { OFA_SAVED_FIREBASE_CONFIG = JSON.parse(localStorage.getItem('ofa-template-config') || 'null'); } catch (_) {}
window.firebaseConfig = Object.assign({}, OFA_DEFAULT_FIREBASE_CONFIG, OFA_SAVED_FIREBASE_CONFIG || {});
window.OFA_FIREBASE_ENABLED = true;

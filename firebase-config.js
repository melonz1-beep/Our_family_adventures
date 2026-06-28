// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCr4mRHzubFblqpdiaBB4lYWwF9TPc4C2g",
  authDomain: "our-family-adventures.firebaseapp.com",
  databaseURL: "https://our-family-adventures-default-rtdb.firebaseio.com",
  projectId: "our-family-adventures",
  storageBucket: "our-family-adventures.firebasestorage.app",
  messagingSenderId: "283204446220",
  appId: "1:283204446220:web:6dfc7570fbff76dc6fa629",
  measurementId: "G-DDRV34JC2Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

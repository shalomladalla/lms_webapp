// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAM5fhzTSWEff4YbXIrrfeBc0YaVqNVteo",
  authDomain: "lms-webapp-9a28a.firebaseapp.com",
  projectId: "lms-webapp-9a28a",
  storageBucket: "lms-webapp-9a28a.firebasestorage.app",
  messagingSenderId: "974434104133",
  appId: "1:974434104133:web:6a085f2faf49f6d1b1842c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
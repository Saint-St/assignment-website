// src/scripts/firebase/config.js

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCvBI2Z9PfSvE6jHjITMg0aekLCHrE6BQ4",
    authDomain: "signapp-34469.firebaseapp.com",
    projectId: "signapp-34469",
    storageBucket: "signapp-34469.firebasestorage.app",
    messagingSenderId: "1001726937336",
    appId: "1:1001726937336:web:3f4e97a9e22e885cba130d",
    measurementId: "G-QHWXC79TC9"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export the services you want to use in your app
export { auth, db, storage };
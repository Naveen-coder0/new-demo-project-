import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyBnSTIv6At2Jnki5K4ARD5SJdZjA_xSbt4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "wearbuy-59cad.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "wearbuy-59cad",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "wearbuy-59cad.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "330705246261",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:330705246261:web:56cc816e563a3124d4f97c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-3H7FGTM0VX",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser)
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };

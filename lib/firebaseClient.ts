import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAuth, type Auth } from "firebase/auth";
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
const ready = Object.values(config).slice(0, 6).every(Boolean);
let app: FirebaseApp | null = null;
export function getFirebaseApp(): FirebaseApp | null {
  if (!ready) return null;
  app ??= getApps()[0] ?? initializeApp(config);
  return app;
}
export function getFirebaseServices(): { auth: Auth; db: Firestore; storage: FirebaseStorage } | null {
  const firebaseApp = getFirebaseApp();
  return firebaseApp ? { auth: getAuth(firebaseApp), db: getFirestore(firebaseApp), storage: getStorage(firebaseApp) } : null;
}
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp || typeof window === "undefined" || !(await isSupported())) return null;
  return getAnalytics(firebaseApp);
}

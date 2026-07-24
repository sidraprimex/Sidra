import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";
import { getFunctions, type Functions } from "firebase/functions";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

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

export interface FirebaseClientServices {
  readonly auth: Auth;
  readonly db: Firestore;
  readonly storage: FirebaseStorage;
  readonly functions: Functions;
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!ready) return null;
  app ??= getApps()[0] ?? initializeApp(config);
  return app;
}

export function getFirebaseServices(): FirebaseClientServices | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  return {
    auth: getAuth(firebaseApp),
    db: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
    functions: getFunctions(firebaseApp),
  };
}

export function requireFirebaseServices(): FirebaseClientServices {
  const services = getFirebaseServices();
  if (!services) {
    throw new Error("Sidra is not connected to Firebase. Add the required environment variables.");
  }
  return services;
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp || typeof window === "undefined" || !(await isSupported())) return null;
  return getAnalytics(firebaseApp);
}

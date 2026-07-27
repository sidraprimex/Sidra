import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Transaction,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getFirebaseServices } from "@/services/firebaseClient";
import type { UserProfile } from "@/types/auth";

const USERS_COLLECTION = "users";

function requireDatabase() {
  const services = getFirebaseServices();
  if (!services) {
    throw new Error("Sidra is not connected to Firebase. Add the required environment variables.");
  }
  return services.db;
}

function normalizedName(user: User, fallback?: string): string {
  const candidate = fallback?.trim() || user.displayName?.trim() || user.email?.split("@")[0] || "Collector";
  return candidate.slice(0, 120);
}

export async function ensureUserProfile(user: User, fullName?: string, phone?: string): Promise<void> {
  const db = requireDatabase();
  const userRef = doc(db, USERS_COLLECTION, user.uid);

  await runTransaction(db, async (transaction: Transaction) => {
    const snapshot = await transaction.get(userRef);
    if (!snapshot.exists()) {
      transaction.set(userRef, {
        uid: user.uid,
        fullName: normalizedName(user, fullName),
        email: user.email ?? "",
        phone: phone?.trim() || user.phoneNumber || null,
        role: "customer",
        studioId: null,
        profilePhoto: user.photoURL ?? null,
        status: "active",
        emailVerified: user.emailVerified,
        preferredLanguage: "en",
        notificationPreferences: {
          transactional: true,
          studioUpdates: true,
          editorial: false,
          marketing: false,
        },
        wishlistCount: 0,
        orderCount: 0,
        loyaltyPoints: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
      return;
    }

    transaction.update(userRef, {
      email: user.email ?? snapshot.data().email ?? "",
      emailVerified: user.emailVerified,
      profilePhoto: user.photoURL ?? snapshot.data().profilePhoto ?? null,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = requireDatabase();
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}

export async function updateEditableProfile(
  uid: string,
  values: Pick<UserProfile, "fullName" | "phone" | "profilePhoto" | "notificationPreferences">
): Promise<void> {
  const db = requireDatabase();
  await updateDoc(doc(db, USERS_COLLECTION, uid), {
    ...values,
    updatedAt: serverTimestamp(),
  });
}

export async function syncEmailVerification(user: User): Promise<void> {
  const db = requireDatabase();
  await setDoc(
    doc(db, USERS_COLLECTION, user.uid),
    { emailVerified: user.emailVerified, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

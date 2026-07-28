import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Transaction,
} from "firebase/firestore";
import {
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseServices } from "@/services/firebaseClient";
import type { UserProfile } from "@/types/auth";

const USERS_COLLECTION = "users";

function requireServices() {
  const services = getFirebaseServices();

  if (!services) {
    throw new Error(
      "Sidra is not connected to Firebase. Check the Firebase environment variables.",
    );
  }

  return services;
}

function normalizedName(user: User, fallback?: string): string {
  const candidate =
    fallback?.trim() ||
    user.displayName?.trim() ||
    user.email?.split("@")[0] ||
    "Collector";

  return candidate.slice(0, 120);
}

export async function ensureUserProfile(
  user: User,
  fullName?: string,
  phone?: string,
): Promise<void> {
  const { db } = requireServices();
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
      profilePhoto:
        snapshot.data().profilePhoto ??
        user.photoURL ??
        null,
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function getUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  const { db } = requireServices();
  const snapshot = await getDoc(
    doc(db, USERS_COLLECTION, uid),
  );

  return snapshot.exists()
    ? (snapshot.data() as UserProfile)
    : null;
}

export async function updateEditableProfile(
  uid: string,
  values: Pick<
    UserProfile,
    | "fullName"
    | "phone"
    | "profilePhoto"
    | "notificationPreferences"
  >,
): Promise<void> {
  const services = requireServices();
  const currentUser = services.auth.currentUser;

  if (!currentUser || currentUser.uid !== uid) {
    throw new Error(
      "Your login session expired. Sign in again and retry.",
    );
  }

  const fullName = values.fullName.trim();

  if (fullName.length < 2) {
    throw new Error("Enter your complete name.");
  }

  await currentUser.reload();
  await ensureUserProfile(
    currentUser,
    fullName,
    values.phone?.trim() || undefined,
  );

  if (currentUser.displayName !== fullName) {
    await updateProfile(currentUser, {
      displayName: fullName,
    });
  }

  await updateDoc(
    doc(services.db, USERS_COLLECTION, uid),
    {
      fullName,
      phone: values.phone?.trim() || null,
      profilePhoto:
        values.profilePhoto ??
        currentUser.photoURL ??
        null,
      notificationPreferences:
        values.notificationPreferences ?? {
          transactional: true,
          studioUpdates: true,
          editorial: false,
          marketing: false,
        },
      email: currentUser.email ?? "",
      emailVerified: currentUser.emailVerified,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function syncEmailVerification(
  user: User,
): Promise<void> {
  const { db } = requireServices();

  await setDoc(
    doc(db, USERS_COLLECTION, user.uid),
    {
      email: user.email ?? "",
      emailVerified: user.emailVerified,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    },
  );
}

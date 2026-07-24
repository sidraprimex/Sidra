import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseServices } from "@/lib/firebaseClient";
import { ensureUserProfile, syncEmailVerification } from "@/services/userService";

function requireAuth() {
  const services = getFirebaseServices();
  if (!services) {
    throw new Error("Sidra is not connected to Firebase. Add the required environment variables.");
  }
  return services.auth;
}

async function prepareAuth() {
  const auth = requireAuth();
  await setPersistence(auth, browserLocalPersistence);
  return auth;
}

async function provision(credential: UserCredential, fullName?: string): Promise<User> {
  await ensureUserProfile(credential.user, fullName);
  return credential.user;
}

export async function registerWithEmail(params: {
  fullName: string;
  email: string;
  password: string;
}): Promise<User> {
  const auth = await prepareAuth();
  const credential = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
  await updateProfile(credential.user, { displayName: params.fullName.trim() });
  await ensureUserProfile(credential.user, params.fullName);
  await sendEmailVerification(credential.user);
  return credential.user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const auth = await prepareAuth();
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  await credential.user.reload();
  await ensureUserProfile(credential.user);
  await syncEmailVerification(credential.user);
  return credential.user;
}

export async function loginWithGoogle(): Promise<User> {
  const auth = await prepareAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provision(await signInWithPopup(auth, provider));
}

export async function requestPasswordReset(email: string): Promise<void> {
  const auth = await prepareAuth();
  await sendPasswordResetEmail(auth, email.trim());
}

export async function resendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function refreshIdentity(user: User): Promise<void> {
  await user.reload();
  await user.getIdToken(true);
  await syncEmailVerification(user);
}

export async function logout(): Promise<void> {
  await signOut(requireAuth());
}

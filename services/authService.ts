import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  onIdTokenChanged,
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
import { getFirebaseServices, requireFirebaseServices } from "@/services/firebaseClient";
import { ensureUserProfile, syncEmailVerification } from "@/services/userService";

export type FirebaseUser = User;
export type AuthUnsubscribe = () => void;

async function prepareAuth() {
  const auth = requireFirebaseServices().auth;
  await setPersistence(auth, browserLocalPersistence);
  return auth;
}

async function provision(credential: UserCredential, fullName?: string): Promise<User> {
  await ensureUserProfile(credential.user, fullName);
  return credential.user;
}

export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void,
  onError?: (error: Error) => void
): AuthUnsubscribe {
  const services = getFirebaseServices();
  if (!services) {
    callback(null);
    return () => undefined;
  }
  return onIdTokenChanged(
    services.auth,
    callback,
    (error: Error) => onError?.(error instanceof Error ? error : new Error("Authentication state failed."))
  );
}

export async function registerWithEmail(params: {
  readonly fullName: string;
  readonly phone: string;
  readonly email: string;
  readonly password: string;
}): Promise<User> {
  const auth = await prepareAuth();
  const credential = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
  await updateProfile(credential.user, { displayName: params.fullName.trim() });
  await ensureUserProfile(credential.user, params.fullName, params.phone);
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

export async function loginWithApple(): Promise<User> {
  const auth = await prepareAuth();
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  return provision(await signInWithPopup(auth, provider));
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(await prepareAuth(), email.trim());
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
  await signOut(requireFirebaseServices().auth);
}

const FRIENDLY_ERRORS: Record<string, string> = {
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/popup-closed-by-user": "The sign-in window was closed before completion.",
  "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups for Sidra and try again.",
  "auth/cancelled-popup-request": "Another sign-in window is already open. Close it and try again.",
  "auth/unauthorized-domain": "This Sidra domain is not authorized in Firebase Authentication.",
  "auth/operation-not-allowed": "This sign-in provider is not enabled for the Firebase project.",
  "auth/account-exists-with-different-credential": "This email already uses another sign-in method. Sign in with that method first.",
  "auth/network-request-failed": "Network connection failed. Check your internet and try again.",
  "auth/too-many-requests": "Too many attempts. Please pause and try again shortly.",
  "auth/user-disabled": "This account is currently unavailable.",
  "auth/weak-password": "Use a stronger password with at least eight characters.",
};

export function getAuthErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code);
    return FRIENDLY_ERRORS[code] ?? `Sign-in failed (${code}). Please try again.`;
  }
  return error instanceof Error ? error.message : "We could not complete this request. Please try again.";
}

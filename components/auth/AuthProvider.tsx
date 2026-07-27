"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { isConfiguredAdminEmail } from "@/config/adminAccess";
import { getFirebaseServices } from "@/services/firebaseClient";
import { subscribeToAuthState, type FirebaseUser } from "@/services/authService";
import { ensureUserProfile, getUserProfile } from "@/services/userService";
import type { AuthClaims, SidraRole, UserProfile } from "@/types/auth";

export interface AuthContextValue {
  readonly user: FirebaseUser | null;
  readonly profile: UserProfile | null;
  readonly claims: AuthClaims | null;
  readonly loading: boolean;
  readonly firebaseReady: boolean;
  readonly refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const firebaseReady = Boolean(getFirebaseServices());
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [claims, setClaims] = useState<AuthClaims | null>(null);
  const [loading, setLoading] = useState(firebaseReady);

  const hydrate = useCallback(async (currentUser: FirebaseUser | null, force = false) => {
    setUser(currentUser);
    if (!currentUser) {
      setProfile(null);
      setClaims(null);
      setLoading(false);
      return;
    }

    await currentUser.reload();
    await ensureUserProfile(currentUser);
    const [nextProfile, tokenResult] = await Promise.all([
      getUserProfile(currentUser.uid),
      currentUser.getIdTokenResult(force),
    ]);

    const tokenRole = tokenResult.claims.role;
    const configuredAdmin = isConfiguredAdminEmail(currentUser.email);
    const role: SidraRole = configuredAdmin
      ? "admin"
      : nextProfile?.role ?? (typeof tokenRole === "string" ? (tokenRole as SidraRole) : "visitor");
    const studioId = nextProfile?.studioId
      ?? (typeof tokenResult.claims.studioId === "string" ? tokenResult.claims.studioId : undefined);

    setProfile(nextProfile);
    setClaims({
      role,
      ...(typeof studioId === "string" && studioId.length > 0 ? { studioId } : {}),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    return subscribeToAuthState(
      (currentUser) => void hydrate(currentUser).catch(() => setLoading(false)),
      () => setLoading(false),
    );
  }, [firebaseReady, hydrate]);

  const refresh = useCallback(async () => {
    await hydrate(user, true);
  }, [hydrate, user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, claims, loading, firebaseReady, refresh }),
    [claims, firebaseReady, loading, profile, refresh, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

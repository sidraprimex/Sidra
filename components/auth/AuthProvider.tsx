"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
    const claimRole = tokenResult.claims.role;
    const role: SidraRole = typeof claimRole === "string" ? (claimRole as SidraRole) : "visitor";
    setProfile(nextProfile);
    setClaims({
      role,
      ...(typeof tokenResult.claims.studioId === "string" ? { studioId: tokenResult.claims.studioId } : {}),
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
      () => setLoading(false)
    );
  }, [firebaseReady, hydrate]);

  const refresh = useCallback(async () => {
    await hydrate(user, true);
  }, [hydrate, user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, claims, loading, firebaseReady, refresh }),
    [claims, firebaseReady, loading, profile, refresh, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

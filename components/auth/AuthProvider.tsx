"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { getFirebaseServices } from "@/lib/firebaseClient";
import { ensureUserProfile, getUserProfile } from "@/services/userService";
import type { AuthClaims, SidraRole, UserProfile } from "@/types/auth";

export interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  claims: AuthClaims | null;
  loading: boolean;
  firebaseReady: boolean;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const services = getFirebaseServices();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [claims, setClaims] = useState<AuthClaims | null>(null);
  const [loading, setLoading] = useState(Boolean(services));

  const hydrate = useCallback(async (currentUser: User | null, force = false) => {
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
    if (!services) {
      setLoading(false);
      return;
    }
    return onIdTokenChanged(services.auth, (currentUser) => {
      void hydrate(currentUser).catch(() => setLoading(false));
    });
  }, [hydrate, services]);

  const refresh = useCallback(async () => {
    await hydrate(user, true);
  }, [hydrate, user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, claims, loading, firebaseReady: Boolean(services), refresh }),
    [claims, loading, profile, refresh, services, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

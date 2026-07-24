"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import type { SidraRole } from "@/types/auth";

interface RouteGuardOptions {
  allowedRoles?: readonly SidraRole[];
  requireVerifiedEmail?: boolean;
  requireStudioId?: boolean;
}

export function useRouteGuard({
  allowedRoles,
  requireVerifiedEmail = true,
  requireStudioId = false,
}: RouteGuardOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (requireVerifiedEmail && !auth.user.emailVerified) {
      router.replace(`/verify-email?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (allowedRoles && (!auth.claims || !allowedRoles.includes(auth.claims.role))) {
      router.replace("/not-authorized");
      return;
    }
    if (requireStudioId && !auth.claims?.studioId) {
      router.replace("/not-authorized");
    }
  }, [allowedRoles, auth.claims, auth.loading, auth.user, pathname, requireStudioId, requireVerifiedEmail, router]);

  return auth;
}

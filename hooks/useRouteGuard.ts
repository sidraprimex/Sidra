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

function roleIsAllowed(role: SidraRole | undefined, allowedRoles: readonly SidraRole[]): boolean {
  if (!role) return false;
  if (allowedRoles.includes(role)) return true;
  return role === "admin" && allowedRoles.some((allowed) => allowed === "founder" || allowed === "superAdmin");
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
    if (auth.profile?.status === "suspended" || auth.profile?.status === "deleted") {
      router.replace("/not-authorized");
      return;
    }
    const effectiveRole = auth.claims?.role ?? auth.profile?.role;
    const effectiveStudioId = auth.claims?.studioId ?? auth.profile?.studioId;
    if (allowedRoles && !roleIsAllowed(effectiveRole, allowedRoles)) {
      router.replace("/not-authorized");
      return;
    }
    if (requireStudioId && !effectiveStudioId) {
      router.replace("/not-authorized");
    }
  }, [allowedRoles, auth.claims, auth.loading, auth.profile, auth.user, pathname, requireStudioId, requireVerifiedEmail, router]);

  return auth;
}

"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { watchSellerRoleGrant } from "@/services/roleRefreshService";

export function RoleClaimRefreshBridge() {
  const { user, claims, refresh } = useAuth();
  const refreshing = useRef(false);
  useEffect(() => {
    if (!user || claims?.role === "seller" || claims?.role === "founder" || claims?.role === "superAdmin") return;
    return watchSellerRoleGrant(user.uid, () => {
      if (refreshing.current) return;
      refreshing.current = true;
      void refresh().finally(() => { refreshing.current = false; });
    });
  }, [claims?.role, refresh, user]);
  return null;
}

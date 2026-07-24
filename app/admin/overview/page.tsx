"use client";

import { AccountShell } from "@/components/account/AccountShell";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";

const ADMIN_ROLES = ["support", "contentManager", "financeManager", "marketingManager", "founder", "superAdmin"] as const;

export default function AdminOverviewPage() {
  const auth = useRouteGuard({ allowedRoles: ADMIN_ROLES });
  if (auth.loading || !auth.user) return <LoadingSkeleton />;
  return <AccountShell eyebrow="Founder operations" title="Sidra control room."><p className="max-w-2xl text-body-lg text-gray-700">The role-protected Founder shell is active. Each operational control will be connected to its domain in the corresponding production phase.</p></AccountShell>;
}

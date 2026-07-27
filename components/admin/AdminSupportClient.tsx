"use client";

import { AccountShell } from "@/components/account/AccountShell";
import { SupportQueue } from "@/components/admin/SupportQueue";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export function AdminSupportClient(): React.JSX.Element {
  const auth = useRouteGuard({ allowedRoles: ["admin", "support", "founder", "superAdmin"] });
  if (auth.loading || !auth.user) return <LoadingSkeleton count={5} />;
  return <AccountShell mode="admin" eyebrow="Care operations" title="Support queue"><SupportQueue /></AccountShell>;
}

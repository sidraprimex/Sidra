"use client";

import { AccountShell } from "@/components/account/AccountShell";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export default function StudioAdminOverviewPage() {
  const auth = useRouteGuard({ allowedRoles: ["seller", "founder", "superAdmin"], requireStudioId: true });
  if (auth.loading || !auth.user) return <LoadingSkeleton />;
  return <AccountShell eyebrow="Studio administration" title="Your Studio is connected."><p className="max-w-2xl text-body-lg text-gray-700">The authenticated Studio shell is ready. Product, order, branding, and analytics modules arrive in their locked phases.</p></AccountShell>;
}

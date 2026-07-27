"use client";

import { AccountShell } from "@/components/account/AccountShell";
import { SellerApplicationsReview } from "@/components/admin/SellerApplicationsReview";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export default function SellerApplicationsPage() {
  const auth = useRouteGuard({ allowedRoles: ["admin", "founder", "superAdmin"] });
  if (auth.loading || !auth.user) return <LoadingSkeleton count={4} />;
  return (
    <AccountShell mode="admin" eyebrow="Admin review" title="Studio access requests">
      <SellerApplicationsReview />
    </AccountShell>
  );
}

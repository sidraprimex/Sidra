"use client";

import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { CustomerDashboardOverview } from "@/components/customer/CustomerDashboardOverview";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { getCustomerDashboardSummary } from "@/services/customerEngagementService";
import type { CustomerDashboardSummary } from "@/types/phase9-customer";

const emptySummary: CustomerDashboardSummary = {
  activeOrderCount: 0,
  deliveredOrderCount: 0,
  customOrderCount: 0,
  wishlistCount: 0,
  followedStudioCount: 0,
  pendingReviewCount: 0,
  unreadNotificationCount: 0,
};

export function CustomerDashboardClient(): React.JSX.Element {
  const auth = useRouteGuard();
  const [summary, setSummary] = useState<CustomerDashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.user) return;
    void getCustomerDashboardSummary(auth.user.uid)
      .then(setSummary)
      .catch(() => {
        setSummary(emptySummary);
        setError("Live dashboard data could not be loaded. Your account remains connected.");
      });
  }, [auth.user]);

  if (auth.loading || !auth.user || !summary) return <LoadingSkeleton count={6} />;

  return (
    <AccountShell mode="customer" eyebrow="Private customer space" title="My Sidra">
      {error ? <p className="mb-5 rounded-[var(--radius-md)] border border-[rgba(140,59,52,0.25)] bg-white/65 p-4 text-sm text-[var(--color-error)]">{error}</p> : null}
      <CustomerDashboardOverview summary={summary} />
    </AccountShell>
  );
}

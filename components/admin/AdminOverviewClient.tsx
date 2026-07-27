"use client";

import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { FounderMetricGrid } from "@/components/admin/FounderMetricGrid";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { getFounderControlCenterSummary } from "@/services/founderAdminService";
import type { FounderControlCenterSummary } from "@/types/phase10-founder-admin";

const empty: FounderControlCenterSummary = { pendingSellerApplications: 0, activeSellers: 0, publishedProducts: 0, pendingOrders: 0, pendingCustomOrders: 0, pendingReviews: 0, unreadFounderAlerts: 0, finance: { grossRevenuePaise: 0, platformRevenuePaise: 0, sellerPayablePaise: 0, refundsPaise: 0, pendingPayoutPaise: 0, completedPayoutPaise: 0, orderCount: 0, customOrderCount: 0 } };
const roles = ["support", "contentManager", "financeManager", "marketingManager", "founder", "superAdmin"] as const;

export function AdminOverviewClient(): React.JSX.Element {
  const auth = useRouteGuard({ allowedRoles: roles });
  const [summary, setSummary] = useState<FounderControlCenterSummary | null>(null);
  useEffect(() => {
    if (!auth.user) return;
    void getFounderControlCenterSummary().then(setSummary).catch(() => setSummary(empty));
  }, [auth.user]);
  if (auth.loading || !auth.user || !summary) return <LoadingSkeleton count={8} />;
  return <AccountShell mode="admin" eyebrow="Founder operations" title="Sidra control room"><FounderMetricGrid summary={summary} /></AccountShell>;
}

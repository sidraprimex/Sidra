"use client";

import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { SellerGrowthDashboard } from "@/components/studio-admin/SellerGrowthDashboard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { getSellerAnalyticsSummary } from "@/services/sellerGrowthService";
import type { SellerAnalyticsSummary } from "@/types/phase11-seller-growth";

const empty: SellerAnalyticsSummary = { grossSalesPaise: 0, netSalesPaise: 0, orderCount: 0, customOrderCount: 0, averageOrderValuePaise: 0, conversionRate: 0, repeatCustomerRate: 0, refundRate: 0, wishlistCount: 0, followerCount: 0 };

export function StudioOverviewClient(): React.JSX.Element {
  const auth = useRouteGuard({ allowedRoles: ["seller", "founder", "superAdmin"], requireStudioId: true });
  const [summary, setSummary] = useState<SellerAnalyticsSummary | null>(null);
  useEffect(() => {
    if (!auth.claims?.studioId) return;
    void getSellerAnalyticsSummary(auth.claims.studioId).then(setSummary).catch(() => setSummary(empty));
  }, [auth.claims?.studioId]);
  if (auth.loading || !auth.user || !auth.claims?.studioId || !summary) return <LoadingSkeleton count={8} />;
  return <AccountShell mode="seller" eyebrow="Studio administration" title="Your Studio"><SellerGrowthDashboard summary={summary} /></AccountShell>;
}

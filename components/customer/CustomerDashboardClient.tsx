"use client";

import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { CustomerDashboardOverview } from "@/components/customer/CustomerDashboardOverview";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { getCustomerDashboardSummary } from "@/services/customerEngagementService";
import { subscribeCart } from "@/services/cartSyncService";
import type { CustomerDashboardSummary } from "@/types/phase9-customer";

const emptySummary: CustomerDashboardSummary = { activeOrderCount:0, deliveredOrderCount:0, customOrderCount:0, wishlistCount:0, followedStudioCount:0, pendingReviewCount:0, unreadNotificationCount:0 };

export function CustomerDashboardClient(): React.JSX.Element {
  const auth = useRouteGuard();
  const [summary, setSummary] = useState<CustomerDashboardSummary | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!auth.user) return;
    const unsubscribe = subscribeCart(auth.user.uid, (cart) => setCartCount(cart.items.reduce((total,item)=>total+item.quantity,0)));
    void getCustomerDashboardSummary(auth.user.uid).then(setSummary).catch(() => { setSummary(emptySummary); setError("Your live account is connected. Some totals need the dashboard cloud function to be deployed."); });
    return unsubscribe;
  }, [auth.user]);
  if (auth.loading || !auth.user || !summary) return <LoadingSkeleton count={6} />;
  return <AccountShell mode="customer" eyebrow="Private customer space" title="My Sidra">
    {error ? <p className="mb-6 rounded-[1.4rem] border border-[rgba(59,30,53,.10)] bg-white/70 p-5 text-sm leading-6 text-black/60 shadow-[0_14px_40px_rgba(59,30,53,.05)]">{error}</p> : null}
    <CustomerDashboardOverview summary={summary} cartCount={cartCount} />
  </AccountShell>;
}

import { CustomerDashboardOverview } from "@/components/customer/CustomerDashboardOverview";
import { getCustomerDashboardSummary } from "@/services/customerEngagementService";
import type { CustomerDashboardSummary } from "@/types/phase9-customer";

export default async function CustomerDashboardPage(): Promise<React.JSX.Element> {
  let summary: CustomerDashboardSummary = {
    activeOrderCount: 0,
    deliveredOrderCount: 0,
    customOrderCount: 0,
    wishlistCount: 0,
    followedStudioCount: 0,
    pendingReviewCount: 0,
    unreadNotificationCount: 0,
  };
  try { summary = await getCustomerDashboardSummary("current-customer"); } catch {}
  return <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
    <header className="mb-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Private customer space</p><h1 className="mt-3 font-heading text-5xl">My SIDRA</h1></header>
    <CustomerDashboardOverview summary={summary} />
  </main>;
}

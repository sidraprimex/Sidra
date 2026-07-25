import { FounderMetricGrid } from "@/components/admin/FounderMetricGrid";
import { getFounderControlCenterSummary } from "@/services/founderAdminService";
import type { FounderControlCenterSummary } from "@/types/phase10-founder-admin";
export default async function Page(): Promise<React.JSX.Element> {
  let summary: FounderControlCenterSummary = { pendingSellerApplications: 0, activeSellers: 0, publishedProducts: 0, pendingOrders: 0, pendingCustomOrders: 0, pendingReviews: 0, unreadFounderAlerts: 0, finance: { grossRevenuePaise: 0, platformRevenuePaise: 0, sellerPayablePaise: 0, refundsPaise: 0, pendingPayoutPaise: 0, completedPayoutPaise: 0, orderCount: 0, customOrderCount: 0 } };
  try { summary = await getFounderControlCenterSummary(); } catch {}
  return <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8"><header className="mb-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Founder-only command layer</p><h1 className="mt-3 font-heading text-5xl">SIDRA Control Center</h1></header><FounderMetricGrid summary={summary} /></main>;
}

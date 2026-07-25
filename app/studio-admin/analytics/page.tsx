import { SellerGrowthDashboard } from "@/components/studio-admin/SellerGrowthDashboard";
import { getSellerAnalyticsSummary } from "@/services/sellerGrowthService";
import type { SellerAnalyticsSummary } from "@/types/phase11-seller-growth";
export default async function Page(): Promise<React.JSX.Element> {
  let summary: SellerAnalyticsSummary = { grossSalesPaise: 0, netSalesPaise: 0, orderCount: 0, customOrderCount: 0, averageOrderValuePaise: 0, conversionRate: 0, repeatCustomerRate: 0, refundRate: 0, wishlistCount: 0, followerCount: 0 };
  try { summary = await getSellerAnalyticsSummary("current-studio"); } catch {}
  return <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8"><header className="mb-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Studio intelligence</p><h1 className="mt-3 font-heading text-5xl">Seller growth</h1></header><SellerGrowthDashboard summary={summary} /></main>;
}

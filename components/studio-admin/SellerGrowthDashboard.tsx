import Link from "next/link";
import { formatInr } from "@/utils/cartTotals";
import type { SellerAnalyticsSummary } from "@/types/phase11-seller-growth";

export function SellerGrowthDashboard({ summary }: { readonly summary: SellerAnalyticsSummary }): React.JSX.Element {
  const metrics = [
    ["Gross sales", formatInr(summary.grossSalesPaise)],
    ["Net sales", formatInr(summary.netSalesPaise)],
    ["Orders", String(summary.orderCount)],
    ["Average order", formatInr(summary.averageOrderValuePaise)],
    ["Conversion", `${summary.conversionRate}%`],
    ["Repeat customers", `${summary.repeatCustomerRate}%`],
    ["Wishlist saves", String(summary.wishlistCount)],
    ["Followers", String(summary.followerCount)],
  ] as const;
  return <div className="grid gap-8">
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label, value]) => <article key={label} className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p><p className="mt-3 font-heading text-3xl">{value}</p></article>)}</section>
    <nav className="grid gap-4 sm:grid-cols-3">
      <Link href="/studio-admin/coupons" className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><h2 className="font-heading text-2xl">Coupons</h2><p className="mt-2 text-muted">Create controlled Studio offers.</p></Link>
      <Link href="/studio-admin/customers" className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><h2 className="font-heading text-2xl">Segments</h2><p className="mt-2 text-muted">Group customers by intent and value.</p></Link>
      <Link href="/studio-admin/campaigns" className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><h2 className="font-heading text-2xl">Campaigns</h2><p className="mt-2 text-muted">Prepare targeted campaign drafts.</p></Link>
    </nav>
  </div>;
}

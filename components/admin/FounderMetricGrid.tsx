import Link from "next/link";
import { formatInr } from "@/utils/cartTotals";
import type { FounderControlCenterSummary } from "@/types/phase10-founder-admin";

export function FounderMetricGrid({ summary }: { readonly summary: FounderControlCenterSummary }): React.JSX.Element {
  const cards = [
    ["Seller applications", summary.pendingSellerApplications, "/admin/sellers/applications"],
    ["Active sellers", summary.activeSellers, "/admin/sellers"],
    ["Published products", summary.publishedProducts, "/admin/products"],
    ["Pending orders", summary.pendingOrders, "/admin/orders"],
    ["Custom orders", summary.pendingCustomOrders, "/admin/custom-orders"],
    ["Pending reviews", summary.pendingReviews, "/admin/reviews"],
  ] as const;
  return <div className="grid gap-6">
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label, value, href]) =>
      <Link key={label} href={href} className="rounded-[var(--radius-lg)] border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p><p className="mt-3 font-heading text-4xl">{value}</p>
      </Link>)}</section>
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <article className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><p className="text-xs uppercase tracking-[0.16em] text-muted">Gross revenue</p><p className="mt-3 font-heading text-3xl">{formatInr(summary.finance.grossRevenuePaise)}</p></article>
      <article className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><p className="text-xs uppercase tracking-[0.16em] text-muted">Platform revenue</p><p className="mt-3 font-heading text-3xl">{formatInr(summary.finance.platformRevenuePaise)}</p></article>
      <article className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><p className="text-xs uppercase tracking-[0.16em] text-muted">Seller payable</p><p className="mt-3 font-heading text-3xl">{formatInr(summary.finance.sellerPayablePaise)}</p></article>
      <article className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><p className="text-xs uppercase tracking-[0.16em] text-muted">Founder alerts</p><p className="mt-3 font-heading text-3xl">{summary.unreadFounderAlerts}</p></article>
    </section>
  </div>;
}

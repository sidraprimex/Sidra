import { formatInr } from "@/utils/cartTotals";
import type { SellerPayout } from "@/types/phase7-orders";

export function PayoutSummary({ payouts }: { readonly payouts: readonly SellerPayout[] }): React.JSX.Element {
  const buckets = (["pending", "available", "paid"] as const).map((status) => ({
    status,
    total: payouts.filter((item) => item.status === status).reduce((sum, item) => sum + item.sellerAmountPaise, 0),
  }));
  return <div className="grid gap-4 sm:grid-cols-3">{buckets.map((bucket) => <article key={bucket.status} className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><p className="text-xs uppercase tracking-[0.16em] text-muted">{bucket.status}</p><p className="mt-3 font-heading text-3xl">{formatInr(bucket.total)}</p></article>)}</div>;
}

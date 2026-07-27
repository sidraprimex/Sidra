import Link from "next/link";
import type { CustomerDashboardSummary } from "@/types/phase9-customer";

const cards = [
  ["Active orders", "activeOrderCount", "/account/orders"],
  ["Delivered", "deliveredOrderCount", "/account/orders"],
  ["Custom orders", "customOrderCount", "/account/custom-orders"],
  ["Wishlist", "wishlistCount", "/account/wishlist"],
  ["Followed Studios", "followedStudioCount", "/studios"],
  ["Pending reviews", "pendingReviewCount", "/account/orders"],
] as const;

export function CustomerDashboardOverview({ summary }: { readonly summary: CustomerDashboardSummary }): React.JSX.Element {
  return <section className="grid gap-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(([label, key, href]) => <Link key={key} href={href} className="rounded-[var(--radius-lg)] border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
        <p className="mt-3 font-heading text-4xl">{summary[key]}</p>
      </Link>)}
    </div>
    <Link href="/account/notifications" className="rounded-[var(--radius-lg)] border border-border bg-card p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">Unread notifications</p>
      <p className="mt-3 font-heading text-4xl">{summary.unreadNotificationCount}</p>
    </Link>
  </section>;
}

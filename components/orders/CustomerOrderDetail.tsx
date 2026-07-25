import { CustomerTrackingBar } from "@/components/orders/CustomerTrackingBar";
import { canShowReviewCta } from "@/utils/orderLifecycle";
import type { FulfilmentOrder } from "@/types/phase7-orders";

export function CustomerOrderDetail({ order }: { readonly order: FulfilmentOrder }): React.JSX.Element {
  return <section className="grid gap-8"><header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">{order.orderNumber}</p><h1 className="mt-3 font-heading text-5xl">Track your order</h1></header><CustomerTrackingBar status={order.orderStatus} /><div className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><h2 className="font-heading text-2xl">Order timeline</h2><div className="mt-4 grid gap-3">{order.timeline.filter((entry) => entry.customerVisible).map((entry) => <div key={entry.id} className="border-l border-[var(--color-gold-600)] pl-4"><p>{entry.label}</p><p className="mt-1 text-xs text-muted">{entry.createdAt}</p></div>)}</div></div><div className="flex flex-wrap gap-3"><a href={order.invoiceUrl} className="rounded-[var(--radius-md)] border border-border px-5 py-3">Download invoice</a>{canShowReviewCta(order.orderStatus) ? <a href={`/account/reviews/new?orderId=${order.orderId}`} className="rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white">Write a review</a> : null}</div></section>;
}

"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { subscribePaymentConfirmation } from "@/services/orderConfirmationService";
import type { OrderConfirmation } from "@/types/phase6-commerce";
import { formatInr } from "@/utils/cartTotals";

export function OrderConfirmationClient({ orderId }: { readonly orderId: string }): React.JSX.Element {
  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  const [error, setError] = useState("");
  useEffect(
    () => subscribePaymentConfirmation(
      orderId,
      (value) => {
        setOrder(value);
        setError("");
      },
      (caught) => setError(caught.message),
    ),
    [orderId],
  );

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  if (!order) {
    return <section className="rounded-[var(--radius-lg)] border border-border bg-card p-10"><h1 className="font-heading text-4xl">Verifying your payment</h1><p className="mt-4 leading-7 text-muted">The gateway webhook is being verified. This page updates automatically once the server creates the order.</p></section>;
  }

  const items = Array.isArray(order.items) ? order.items : [];
  return <section className="grid gap-8"><header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-success)]">Payment verified</p><h1 className="mt-3 font-heading text-[clamp(3rem,8vw,6rem)]">Order confirmed</h1><p className="mt-4 text-lg text-muted">{order.orderNumber}</p></header><div className="rounded-[var(--radius-lg)] border border-border bg-card p-6">{items.map((item) => <div key={`${item.productId}-${item.variantId ?? "default"}`} className="flex justify-between border-b border-border py-4 last:border-0"><span>{item.productName} × {item.quantity}</span><span>{formatInr(item.unitPricePaise * item.quantity)}</span></div>)}<div className="mt-5 flex justify-between border-t border-border pt-5 font-heading text-2xl"><span>Total</span><span>{formatInr(order.totalPaise)}</span></div></div><div className="flex flex-wrap gap-3">{order.invoiceUrl ? <a href={order.invoiceUrl} className="rounded-[var(--radius-md)] border border-border px-5 py-3">Download invoice</a> : null}<a href={`/account/orders/${order.orderId}`} className="rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white">Track order</a></div></section>;
}

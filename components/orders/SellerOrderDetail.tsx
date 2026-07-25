"use client";

import { useMemo, useState } from "react";
import { updateOrderStatus } from "@/services/orderLifecycleService";
import { legalSellerTransitions, requiresShippingPackage } from "@/utils/orderLifecycle";
import type { FulfilmentOrder, ShippingPackage } from "@/types/phase7-orders";

const emptyPackage: ShippingPackage = {
  weightGrams: 0,
  lengthCm: 0,
  widthCm: 0,
  heightCm: 0,
  courierName: "",
  trackingNumber: "",
  estimatedDeliveryDate: "",
  dispatchedAt: null,
};

export function SellerOrderDetail({ order }: { readonly order: FulfilmentOrder }): React.JSX.Element {
  const [shippingPackage, setShippingPackage] = useState(emptyPackage);
  const [busy, setBusy] = useState(false);
  const nextStatuses = legalSellerTransitions[order.orderStatus];
  const packageValid = useMemo(() => shippingPackage.weightGrams > 0 && shippingPackage.lengthCm > 0 && shippingPackage.widthCm > 0 && shippingPackage.heightCm > 0 && shippingPackage.courierName.trim().length > 1 && shippingPackage.trackingNumber.trim().length > 2 && shippingPackage.estimatedDeliveryDate.length > 0, [shippingPackage]);

  const move = async (nextStatus: typeof nextStatuses[number]) => {
    setBusy(true);
    try {
      await updateOrderStatus({
        orderId: order.orderId,
        nextStatus,
        shippingPackage: requiresShippingPackage(nextStatus) ? shippingPackage : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return <section className="grid gap-8"><header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">{order.orderNumber}</p><h1 className="mt-3 font-heading text-5xl">Order fulfilment</h1></header><div className="grid gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-6"><h2 className="font-heading text-2xl">Customer and delivery</h2><p>{order.customerName}</p><p className="text-sm text-muted">{order.customerEmail} · {order.customerPhone}</p></div>
    {nextStatuses.includes("readyToShip") ? <div className="grid gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-6"><h2 className="font-heading text-2xl">Shipping package required</h2><div className="grid gap-3 sm:grid-cols-2"><input type="number" placeholder="Weight grams" onChange={(event) => setShippingPackage({ ...shippingPackage, weightGrams: Number(event.target.value) })} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /><input type="text" placeholder="Courier" onChange={(event) => setShippingPackage({ ...shippingPackage, courierName: event.target.value })} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /><input type="text" placeholder="Tracking number" onChange={(event) => setShippingPackage({ ...shippingPackage, trackingNumber: event.target.value })} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /><input type="date" onChange={(event) => setShippingPackage({ ...shippingPackage, estimatedDeliveryDate: event.target.value })} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /><input type="number" placeholder="Length cm" onChange={(event) => setShippingPackage({ ...shippingPackage, lengthCm: Number(event.target.value) })} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /><input type="number" placeholder="Width cm" onChange={(event) => setShippingPackage({ ...shippingPackage, widthCm: Number(event.target.value) })} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /><input type="number" placeholder="Height cm" onChange={(event) => setShippingPackage({ ...shippingPackage, heightCm: Number(event.target.value) })} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></div></div> : null}
    <div className="flex flex-wrap gap-3">{nextStatuses.map((status) => <button key={status} disabled={busy || (status === "readyToShip" && !packageValid)} onClick={() => void move(status)} className="rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50">Move to {status}</button>)}</div>
  </section>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { listCustomerCustomOrders } from "@/services/customOrderService";
import type { CustomOrder } from "@/types/phase8-custom-orders";

export function CustomerCustomOrdersClient(): React.JSX.Element {
  const auth = useRouteGuard();
  const [orders, setOrders] = useState<readonly CustomOrder[] | null>(null);
  useEffect(() => {
    if (!auth.user) return;
    void listCustomerCustomOrders(auth.user.uid).then(setOrders).catch(() => setOrders([]));
  }, [auth.user]);
  if (auth.loading || !auth.user || !orders) return <LoadingSkeleton count={5} />;
  return <AccountShell mode="customer" eyebrow="Bespoke commissions" title="Custom orders"><div className="grid gap-4">{orders.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-border bg-white/70 p-10 text-center text-muted">No custom orders yet.</div> : orders.map((order) => <Link key={order.customOrderId} href={`/account/custom-orders/${order.customOrderId}`} className="rounded-[var(--radius-lg)] border border-border bg-white/72 p-6 shadow-[var(--shadow-card)]"><span className="text-xs uppercase tracking-[0.14em] text-muted">{order.status}</span><div className="mt-3 flex flex-wrap justify-between gap-4"><span className="font-heading text-2xl">{order.brief.title}</span><span>{order.studioName}</span></div></Link>)}</div></AccountShell>;
}

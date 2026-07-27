"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { listCustomerOrders } from "@/services/orderLifecycleService";
import type { FulfilmentOrder } from "@/types/phase7-orders";

export function CustomerOrdersClient(): React.JSX.Element {
  const auth = useRouteGuard();
  const [orders, setOrders] = useState<readonly FulfilmentOrder[] | null>(null);
  useEffect(() => {
    if (!auth.user) return;
    void listCustomerOrders(auth.user.uid).then(setOrders).catch(() => setOrders([]));
  }, [auth.user]);
  if (auth.loading || !auth.user || !orders) return <LoadingSkeleton count={5} />;
  return <AccountShell mode="customer" eyebrow="Your collection journey" title="Orders"><div className="grid gap-4">{orders.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-border bg-white/70 p-10 text-center text-muted">No orders yet.</div> : orders.map((order) => <Link key={order.orderId} href={`/account/orders/${order.orderId}`} className="rounded-[var(--radius-lg)] border border-border bg-white/72 p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)] sm:p-6"><span className="text-xs text-muted">{order.orderNumber}</span><div className="mt-3 flex flex-wrap justify-between gap-4"><span className="font-heading text-2xl">{order.studioName}</span><span className="rounded-full bg-[rgba(217,167,176,0.22)] px-3 py-1 text-xs font-semibold">{order.orderStatus}</span></div></Link>)}</div></AccountShell>;
}

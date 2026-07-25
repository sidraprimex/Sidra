"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { FulfilmentOrder, OrderStatus } from "@/types/phase7-orders";

const columns: readonly { title: string; statuses: readonly OrderStatus[] }[] = [
  { title: "Pending", statuses: ["placed"] },
  { title: "Accepted", statuses: ["accepted"] },
  { title: "Production Queue", statuses: ["inProduction", "qualityCheck"] },
  { title: "Ready to Pack", statuses: ["packaged"] },
  { title: "Packed", statuses: ["readyToShip"] },
  { title: "Awaiting Pickup", statuses: ["shipped"] },
  { title: "Shipped", statuses: ["inTransit", "outForDelivery"] },
  { title: "Completed", statuses: ["delivered", "completed"] },
];

export function SellerOrderBoard({ orders }: { readonly orders: readonly FulfilmentOrder[] }): React.JSX.Element {
  const [view, setView] = useState<"board" | "table">("board");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter((order) => [order.orderNumber, order.customerName, order.customerEmail, order.orderStatus].some((value) => value.toLowerCase().includes(needle)));
  }, [orders, search]);

  return <section className="grid gap-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer or status" className="min-w-64 rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" />
      <div className="flex gap-2"><button onClick={() => setView("board")} className="rounded-[var(--radius-md)] border border-border px-4 py-2">Board</button><button onClick={() => setView("table")} className="rounded-[var(--radius-md)] border border-border px-4 py-2">Table</button></div>
    </div>
    {filtered.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">No orders match this view.</div> : null}
    {view === "board" ? <div className="grid gap-4 overflow-x-auto lg:grid-cols-4">{columns.map((column) => {
      const items = filtered.filter((order) => column.statuses.includes(order.orderStatus));
      return <div key={column.title} className="min-w-64 rounded-[var(--radius-lg)] border border-border bg-card p-4"><div className="flex justify-between"><h2 className="font-heading text-xl">{column.title}</h2><span className="text-sm text-muted">{items.length}</span></div><div className="mt-4 grid gap-3">{items.map((order) => <Link key={order.orderId} href={`/studio-admin/orders/${order.orderId}`} className="rounded-[var(--radius-md)] border border-border bg-background p-4"><span className="block text-xs text-muted">{order.orderNumber}</span><span className="mt-2 block font-medium">{order.customerName}</span></Link>)}</div></div>;
    })}</div> : <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-card"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border"><th className="p-4">Order</th><th className="p-4">Customer</th><th className="p-4">Status</th><th className="p-4">Studio</th></tr></thead><tbody>{filtered.map((order) => <tr key={order.orderId} className="border-b border-border last:border-0"><td className="p-4"><Link href={`/studio-admin/orders/${order.orderId}`}>{order.orderNumber}</Link></td><td className="p-4">{order.customerName}</td><td className="p-4">{order.orderStatus}</td><td className="p-4">{order.studioName}</td></tr>)}</tbody></table></div>}
  </section>;
}

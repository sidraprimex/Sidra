import Link from "next/link";
import { listCustomerOrders } from "@/services/orderLifecycleService";
import type { FulfilmentOrder } from "@/types/phase7-orders";

export default async function CustomerOrdersPage(): Promise<React.JSX.Element> {
  let orders: FulfilmentOrder[] = [];
  try { orders = [...await listCustomerOrders("current-customer")]; } catch { orders = []; }
  return <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8"><header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Your collection journey</p><h1 className="mt-3 font-heading text-5xl">Orders</h1></header><div className="mt-8 grid gap-4">{orders.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">No orders yet.</div> : orders.map((order) => <Link key={order.orderId} href={`/account/orders/${order.orderId}`} className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><span className="text-xs text-muted">{order.orderNumber}</span><div className="mt-3 flex justify-between gap-4"><span className="font-heading text-2xl">{order.studioName}</span><span>{order.orderStatus}</span></div></Link>)}</div></main>;
}

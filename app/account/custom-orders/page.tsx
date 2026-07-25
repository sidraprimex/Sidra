import Link from "next/link";
import { listCustomerCustomOrders } from "@/services/customOrderService";
import type { CustomOrder } from "@/types/phase8-custom-orders";

export default async function CustomerCustomOrdersPage(): Promise<React.JSX.Element> {
  let orders: CustomOrder[] = [];
  try { orders = [...await listCustomerCustomOrders("current-customer")]; } catch { orders = []; }
  return <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
    <header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Bespoke commissions</p><h1 className="mt-3 font-heading text-5xl">Custom orders</h1></header>
    <div className="mt-8 grid gap-4">{orders.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">No custom orders yet.</div> : orders.map((order) => <Link key={order.customOrderId} href={`/account/custom-orders/${order.customOrderId}`} className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><span className="text-xs uppercase tracking-[0.14em] text-muted">{order.status}</span><div className="mt-3 flex justify-between gap-4"><span className="font-heading text-2xl">{order.brief.title}</span><span>{order.studioName}</span></div></Link>)}</div>
  </main>;
}

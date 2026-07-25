import Link from "next/link";
import { listStudioCustomOrders } from "@/services/customOrderService";
import type { CustomOrder } from "@/types/phase8-custom-orders";

export default async function StudioCustomOrdersPage(): Promise<React.JSX.Element> {
  let orders: CustomOrder[] = [];
  try { orders = [...await listStudioCustomOrders("current-studio")]; } catch { orders = []; }
  return <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8">
    <header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Bespoke production</p><h1 className="mt-3 font-heading text-5xl">Custom order studio</h1></header>
    <div className="mt-8 grid gap-4">{orders.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">No custom requests assigned to this Studio.</div> : orders.map((order) => <Link key={order.customOrderId} href={`/studio-admin/custom-orders/${order.customOrderId}`} className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><span className="text-xs uppercase tracking-[0.14em] text-muted">{order.status}</span><div className="mt-3 flex justify-between gap-4"><span className="font-heading text-2xl">{order.brief.title}</span><span>{order.customerName}</span></div></Link>)}</div>
  </main>;
}

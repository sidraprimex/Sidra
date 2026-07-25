import { SellerOrderBoard } from "@/components/orders/SellerOrderBoard";
import { listStudioOrders } from "@/services/orderLifecycleService";
import type { FulfilmentOrder } from "@/types/phase7-orders";

export default async function StudioOrdersPage(): Promise<React.JSX.Element> {
  let orders: FulfilmentOrder[] = [];
  try { orders = [...await listStudioOrders("current-studio")]; } catch { orders = []; }
  return <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8"><header className="mb-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Fulfilment workspace</p><h1 className="mt-3 font-heading text-5xl">Studio orders</h1></header><SellerOrderBoard orders={orders} /></main>;
}

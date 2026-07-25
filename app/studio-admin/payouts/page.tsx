import { PayoutSummary } from "@/components/orders/PayoutSummary";
import { listStudioPayouts } from "@/services/orderLifecycleService";
import type { SellerPayout } from "@/types/phase7-orders";

export default async function StudioPayoutsPage(): Promise<React.JSX.Element> {
  let payouts: SellerPayout[] = [];
  try { payouts = [...await listStudioPayouts("current-studio")]; } catch { payouts = []; }
  return <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8"><header className="mb-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Seller finance</p><h1 className="mt-3 font-heading text-5xl">Payouts</h1></header><PayoutSummary payouts={payouts} /></main>;
}

import { SellerGrowthManager } from "@/components/studio-admin/SellerGrowthManager";
import { listCustomerSegments } from "@/services/sellerGrowthService";
export default async function Page(): Promise<React.JSX.Element> {
  let options: { id: string; name: string }[] = [];
  try { options = (await listCustomerSegments("current-studio")).map((s) => ({ id: s.segmentId, name: s.name })); } catch {}
  return <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8"><header className="mb-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Studio growth engine</p><h1 className="mt-3 font-heading text-5xl">Campaigns</h1></header><SellerGrowthManager studioId="current-studio" mode="campaign" segmentOptions={options} /></main>;
}

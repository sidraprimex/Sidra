import { SellerGrowthManager } from "@/components/studio-admin/SellerGrowthManager";
export default function Page(): React.JSX.Element {
  return <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8"><header className="mb-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Controlled offers</p><h1 className="mt-3 font-heading text-5xl">Coupons</h1></header><SellerGrowthManager studioId="current-studio" mode="coupon" /></main>;
}

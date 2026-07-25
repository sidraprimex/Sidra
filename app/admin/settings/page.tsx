import { CommerceSettingsForm } from "@/components/admin/CommerceSettingsForm";
import type { CommerceSettings } from "@/types/phase10-founder-admin";
const defaults: CommerceSettings = { currency: "INR", platformFeePercent: 10, defaultSellerCommissionPercent: 0, minimumPayoutPaise: 50000, payoutHoldDays: 7, customOrderDepositPercent: 50, maximumDiscountPercent: 40, sellerSubscriptionEnabled: false, sellerSubscriptionPricePaise: 0, customerCancellationWindowMinutes: 30, updatedBy: "", updatedAt: "" };
export default function Page(): React.JSX.Element {
  return <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8"><header className="mb-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Commercial governance</p><h1 className="mt-3 font-heading text-5xl">Commerce settings</h1></header><CommerceSettingsForm initialSettings={defaults} /></main>;
}

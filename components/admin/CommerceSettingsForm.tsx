"use client";
import { useState } from "react";
import { saveCommerceSettings } from "@/services/founderAdminService";
import type { CommerceSettings } from "@/types/phase10-founder-admin";

export function CommerceSettingsForm({ initialSettings }: { readonly initialSettings: CommerceSettings }): React.JSX.Element {
  const [settings, setSettings] = useState(initialSettings);
  const [busy, setBusy] = useState(false);
  const setNumber = (key: keyof CommerceSettings, value: number) => setSettings((s) => ({ ...s, [key]: value }));
  const save = async () => { setBusy(true); try { await saveCommerceSettings(settings); } finally { setBusy(false); } };
  return <section className="grid gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-6">
    <h2 className="font-heading text-3xl">Global commerce controls</h2>
    <div className="grid gap-5 md:grid-cols-2">
      <label className="grid gap-2"><span>Platform fee %</span><input type="number" min="0" max="100" value={settings.platformFeePercent} onChange={(e) => setNumber("platformFeePercent", Number(e.target.value))} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Seller commission %</span><input type="number" min="0" max="100" value={settings.defaultSellerCommissionPercent} onChange={(e) => setNumber("defaultSellerCommissionPercent", Number(e.target.value))} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Minimum payout ₹</span><input type="number" min="0" value={settings.minimumPayoutPaise / 100} onChange={(e) => setNumber("minimumPayoutPaise", Math.round(Number(e.target.value) * 100))} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Payout hold days</span><input type="number" min="0" value={settings.payoutHoldDays} onChange={(e) => setNumber("payoutHoldDays", Number(e.target.value))} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Custom-order deposit %</span><input type="number" min="0" max="100" value={settings.customOrderDepositPercent} onChange={(e) => setNumber("customOrderDepositPercent", Number(e.target.value))} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Maximum discount %</span><input type="number" min="0" max="100" value={settings.maximumDiscountPercent} onChange={(e) => setNumber("maximumDiscountPercent", Number(e.target.value))} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Seller subscription ₹</span><input type="number" min="0" value={settings.sellerSubscriptionPricePaise / 100} onChange={(e) => setNumber("sellerSubscriptionPricePaise", Math.round(Number(e.target.value) * 100))} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Cancellation window minutes</span><input type="number" min="0" value={settings.customerCancellationWindowMinutes} onChange={(e) => setNumber("customerCancellationWindowMinutes", Number(e.target.value))} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
    </div>
    <label className="flex items-center gap-3"><input type="checkbox" checked={settings.sellerSubscriptionEnabled} onChange={(e) => setSettings((s) => ({ ...s, sellerSubscriptionEnabled: e.target.checked }))} /><span>Enable seller subscription</span></label>
    <button disabled={busy} onClick={() => void save()} className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50">{busy ? "Saving…" : "Save commerce settings"}</button>
  </section>;
}

"use client";

import { useState } from "react";
import { sendCustomOrderQuote } from "@/services/customOrderService";

export function SellerQuoteForm({ customOrderId }: { readonly customOrderId: string }): React.JSX.Element {
  const [price, setPrice] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [productionDays, setProductionDays] = useState(7);
  const [revisionLimit, setRevisionLimit] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");
  const [terms, setTerms] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendCustomOrderQuote({
        customOrderId,
        pricePaise: Math.round(price * 100),
        shippingPaise: Math.round(shipping * 100),
        productionDays,
        revisionLimit,
        expiresAt,
        terms,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Quote could not be sent.",
      );
    } finally {
      setBusy(false);
    }
  };

  return <section className="grid gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-6">
    <h2 className="font-heading text-2xl">Create formal quote</h2>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2"><span>Creation price (₹)</span><input type="number" min="1" value={price || ""} onChange={(event) => setPrice(Number(event.target.value))} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Shipping (₹)</span><input type="number" min="0" value={shipping || ""} onChange={(event) => setShipping(Number(event.target.value))} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Production days</span><input type="number" min="1" value={productionDays} onChange={(event) => setProductionDays(Number(event.target.value))} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Included revisions</span><input type="number" min="0" value={revisionLimit} onChange={(event) => setRevisionLimit(Number(event.target.value))} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Quote expiry</span><input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
    </div>
    <label className="grid gap-2"><span>Terms</span><textarea rows={5} value={terms} onChange={(event) => setTerms(event.target.value)} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
    <button disabled={busy || price <= 0 || productionDays <= 0 || !expiresAt || terms.trim().length < 20} onClick={() => void submit()} className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50">{busy ? "Sending…" : "Send quote"}</button>
    {error ? <p className="text-sm text-red-700">{error}</p> : null}
  </section>;
}

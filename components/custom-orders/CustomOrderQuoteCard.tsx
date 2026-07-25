"use client";

import { useState } from "react";
import { acceptCustomOrderQuote } from "@/services/customOrderService";
import { formatInr } from "@/utils/cartTotals";
import type { CustomOrderQuote } from "@/types/phase8-custom-orders";

export function CustomOrderQuoteCard({
  customOrderId,
  quote,
  canAccept,
}: {
  readonly customOrderId: string;
  readonly quote: CustomOrderQuote;
  readonly canAccept: boolean;
}): React.JSX.Element {
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    setBusy(true);
    try {
      const result = await acceptCustomOrderQuote(customOrderId);
      window.location.assign(`/checkout/custom-order/${result.checkoutReference}`);
    } finally {
      setBusy(false);
    }
  };

  return <article className="rounded-[var(--radius-lg)] border border-[var(--color-gold-600)] bg-card p-6">
    <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-gold-600)]">Formal quote</p>
    <div className="mt-4 grid gap-3">
      <div className="flex justify-between"><span>Creation</span><span>{formatInr(quote.pricePaise)}</span></div>
      <div className="flex justify-between"><span>Shipping</span><span>{formatInr(quote.shippingPaise)}</span></div>
      <div className="flex justify-between border-t border-border pt-4 font-heading text-2xl"><span>Total</span><span>{formatInr(quote.totalPaise)}</span></div>
    </div>
    <p className="mt-4 text-sm text-muted">{quote.productionDays} production days · {quote.revisionLimit} included revisions · expires {quote.expiresAt}</p>
    <p className="mt-4 whitespace-pre-wrap leading-7">{quote.terms}</p>
    {canAccept ? <button disabled={busy} onClick={() => void accept()} className="mt-6 rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50">{busy ? "Preparing payment…" : "Accept quote and continue"}</button> : null}
  </article>;
}

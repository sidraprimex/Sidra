"use client";

import { useEffect, useState } from "react";
import { UpiPaymentQr } from "@/components/payments/UpiPaymentQr";
import {
  defaultPaymentSettings,
  getCheckoutPaymentSettings,
} from "@/services/paymentConfigurationService";
import { submitCustomOrderPaymentReference } from "@/services/customOrderService";
import type {
  CustomOrderPaymentStatus,
  CustomOrderQuote,
} from "@/types/phase8-custom-orders";
import type { CheckoutPaymentSettings } from "@/types/payment-settings";
import { formatInr } from "@/utils/cartTotals";

export function CustomOrderQuoteCard({
  customOrderId,
  quote,
  canAccept,
  paymentStatus,
  paymentReference,
}: {
  readonly customOrderId: string;
  readonly quote: CustomOrderQuote;
  readonly canAccept: boolean;
  readonly paymentStatus: CustomOrderPaymentStatus;
  readonly paymentReference: string | null;
}): React.JSX.Element {
  const [settings, setSettings] =
    useState<CheckoutPaymentSettings>(defaultPaymentSettings);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getCheckoutPaymentSettings()
      .then(setSettings)
      .catch(() => setSettings(defaultPaymentSettings));
  }, []);

  const submitPayment = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await submitCustomOrderPaymentReference(
        customOrderId,
        reference,
      );
      setReference("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Payment reference could not be submitted.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-gold-600)] bg-card p-6">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-gold-600)]">
        Formal quote
      </p>
      <div className="mt-4 grid gap-3">
        <div className="flex justify-between">
          <span>Creation</span>
          <span>{formatInr(quote.pricePaise)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{formatInr(quote.shippingPaise)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-4 font-heading text-2xl">
          <span>Total</span>
          <span>{formatInr(quote.totalPaise)}</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">
        {quote.productionDays} production days ·{" "}
        {quote.revisionLimit} included revisions · expires{" "}
        {quote.expiresAt}
      </p>
      <p className="mt-4 whitespace-pre-wrap leading-7">
        {quote.terms}
      </p>

      {paymentStatus === "pendingVerification" ? (
        <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-background p-5">
          <p className="font-semibold">
            Payment verification pending
          </p>
          <p className="mt-2 text-sm text-muted">
            UTR {paymentReference} is waiting for Sidra admin
            approval. Chat will unlock after verification.
          </p>
        </div>
      ) : null}
      {paymentStatus === "verified" ? (
        <p className="mt-6 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          Payment verified. The private buyer–Studio chat is
          unlocked.
        </p>
      ) : null}
      {paymentStatus === "rejected" ? (
        <p className="mt-6 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          The earlier payment reference was rejected. Check the
          transfer and submit the correct UTR below.
        </p>
      ) : null}

      {canAccept &&
      paymentStatus !== "pendingVerification" &&
      paymentStatus !== "verified" ? (
        <div className="mt-6 grid gap-5 rounded-[var(--radius-md)] border border-border bg-background p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--color-gold-600)]">
              Pay Sidra platform
            </p>
            <p className="mt-2 text-sm text-muted">
              Pay this exact quote amount to{" "}
              <strong>{settings.upiId}</strong>. The Studio does
              not receive payment directly.
            </p>
          </div>
          <UpiPaymentQr
            upiId={settings.upiId}
            payeeName={settings.accountHolderName || "Sidra"}
            amountPaise={quote.totalPaise}
            reference={`Custom order ${customOrderId.slice(0, 8)}`}
          />
          <label className="grid gap-2 text-sm font-semibold">
            UTR / transaction reference
            <input
              value={reference}
              onChange={(event) =>
                setReference(event.target.value)
              }
              className="rounded-[var(--radius-md)] border border-border bg-white px-4 py-3"
              placeholder="Example: 312345678901"
            />
          </label>
          <button
            type="button"
            disabled={busy || reference.trim().length < 4}
            onClick={() => void submitPayment()}
            className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-deep-plum)] px-5 py-3 text-white disabled:opacity-50"
          >
            {busy
              ? "Submitting…"
              : "Accept quote and submit payment"}
          </button>
          {error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

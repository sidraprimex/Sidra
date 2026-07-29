"use client";

import { useEffect, useState } from "react";
import { UpiPaymentQr } from "@/components/payments/UpiPaymentQr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  submitSellerSubscriptionRequest,
  watchStudioSubscriptionRequests,
} from "@/services/sellerSubscriptionService";
import {
  SELLER_PLANS,
  type SellerSubscriptionPlan,
  type SellerSubscriptionRequest,
} from "@/types/seller-subscription";

const paidPlans = ["monthly500", "monthly2000"] as const;

function millis(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function SellerSubscriptionManager({
  studioId,
  sellerUid,
}: {
  readonly studioId: string;
  readonly sellerUid: string;
}): React.JSX.Element {
  const [selected, setSelected] = useState<(typeof paidPlans)[number]>("monthly500");
  const [reference, setReference] = useState("");
  const [requests, setRequests] = useState<readonly SellerSubscriptionRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(
    () => watchStudioSubscriptionRequests(studioId, setRequests, (error) => setMessage(error.message)),
    [studioId],
  );

  const latest = [...requests].sort((left, right) => {
    return millis(right.createdAt) - millis(left.createdAt);
  })[0];

  return <div className="grid gap-6">
    <div className="grid gap-4 lg:grid-cols-3">
      {(Object.keys(SELLER_PLANS) as SellerSubscriptionPlan[]).map((plan) => {
        const item = SELLER_PLANS[plan];
        return <Card key={plan} elevated className={selected === plan ? "border-[var(--color-dusty-rose)]" : ""}><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--color-dusty-rose)]">{item.label}</p><p className="mt-4 font-display text-5xl text-[var(--color-deep-plum)]">{item.monthlyFeePaise ? `₹${item.monthlyFeePaise / 100}` : "₹0"}</p><p className="mt-3 text-sm text-gray-700">Platform commission: 0–{item.maximumCommissionBasisPoints / 100}% of seller profit.</p>{plan !== "commission" ? <Button className="mt-5 w-full" variant={selected === plan ? "primary" : "outline"} onClick={() => setSelected(plan)}>Choose plan</Button> : <p className="mt-5 text-xs text-gray-600">Default when no paid plan is active.</p>}</Card>;
      })}
    </div>
    <Card elevated className="grid gap-6 md:grid-cols-[1fr_auto]">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--color-dusty-rose)]">Activate {SELLER_PLANS[selected].label}</p><h2 className="mt-3 font-display text-4xl text-[var(--color-deep-plum)]">Pay ₹{SELLER_PLANS[selected].monthlyFeePaise / 100}</h2><label className="mt-5 grid gap-2 text-sm font-semibold">UTR / payment reference<input value={reference} onChange={(event) => setReference(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3" /></label><Button className="mt-4" loading={busy} onClick={async () => { setBusy(true); setMessage(""); try { await submitSellerSubscriptionRequest({ studioId, sellerUid, plan: selected, paymentReference: reference }); setReference(""); setMessage("Subscription payment submitted. Admin approval is pending."); } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Request could not be submitted."); } finally { setBusy(false); } }}>Submit for admin approval</Button></div>
      <UpiPaymentQr upiId="tradewithsyed@ybl" payeeName="Sidra" amountPaise={SELLER_PLANS[selected].monthlyFeePaise} reference={`${studioId} ${selected}`} />
    </Card>
    {latest ? <Card><p className="text-sm">Latest request: <strong>{SELLER_PLANS[latest.plan].label}</strong> · <strong>{latest.status}</strong></p>{latest.adminNote ? <p className="mt-2 text-sm text-gray-700">{latest.adminNote}</p> : null}</Card> : null}
    {message ? <p className="rounded-2xl border border-black/10 bg-white p-4 text-sm">{message}</p> : null}
  </div>;
}

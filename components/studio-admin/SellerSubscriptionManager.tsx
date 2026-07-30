"use client";

import { useEffect, useState } from "react";
import { UpiPaymentQr } from "@/components/payments/UpiPaymentQr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  submitSellerSubscriptionRequest,
  watchSellerInstallmentSchedule,
  watchStudioSubscriptionRequests,
} from "@/services/sellerSubscriptionService";
import {
  type SellerSubscriptionRequest,
  type SellerInstallmentSchedule,
} from "@/types/seller-subscription";
import { defaultSellerCommerceSettings, watchSellerCommerceSettings } from "@/services/businessConfigurationService";

const paidPlans = ["starter", "growth", "luxury", "custom"] as const;

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
  const [selected, setSelected] = useState<(typeof paidPlans)[number]>("starter");
  const [reference, setReference] = useState("");
  const [requests, setRequests] = useState<readonly SellerSubscriptionRequest[]>([]);
  const [settings, setSettings] = useState(defaultSellerCommerceSettings);
  const [installments, setInstallments] = useState<SellerInstallmentSchedule | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(
    () => watchStudioSubscriptionRequests(studioId, setRequests, (error) => setMessage(error.message)),
    [studioId],
  );
  useEffect(() => watchSellerCommerceSettings(setSettings, (error) => setMessage(error.message)), []);
  useEffect(() => watchSellerInstallmentSchedule(studioId, setInstallments, (error) => setMessage(error.message)), [studioId]);
  const plans = settings.plans.filter((plan) => plan.enabled);
  const selectedPlan = plans.find((plan) => plan.id === selected) ?? plans.find((plan) => plan.id !== "free") ?? settings.plans[1];

  const latest = [...requests].sort((left, right) => {
    return millis(right.createdAt) - millis(left.createdAt);
  })[0];

  return <div className="grid gap-6">
    {installments ? <Card elevated><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--color-dusty-rose)]">Studio access installments</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-4xl text-[var(--color-deep-plum)]">₹{installments.paidPaise / 100} of ₹{installments.totalPaise / 100} paid</h2><p className="mt-2 text-sm text-gray-700">Access: <strong>full</strong> · Schedule: <strong>{installments.status}</strong>. Overdue payments use reminders, grace and gradual new-business restrictions; active orders and support remain available.</p></div><span className="rounded-full bg-white px-4 py-2 text-xs font-semibold">{installments.installments.map((item) => `${item.number}: ${item.status}`).join(" · ")}</span></div></Card> : null}
    <div className="grid gap-4 lg:grid-cols-3">
      {plans.map((item) => {
        const plan = item.id;
        return <Card key={plan} elevated className={selected === plan ? "border-[var(--color-dusty-rose)]" : ""}><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--color-dusty-rose)]">{item.label}</p>{item.originalMonthlyFeePaise > item.monthlyFeePaise ? <p className="mt-3 text-sm text-black/45 line-through">₹{item.originalMonthlyFeePaise / 100}</p> : null}<p className="mt-1 font-display text-5xl text-[var(--color-deep-plum)]">{item.monthlyFeePaise ? `₹${item.monthlyFeePaise / 100}` : "₹0"}</p><p className="mt-3 text-sm text-gray-700">Platform commission: {item.commissionMode === "range" ? "0–" : ""}{item.commissionBasisPoints / 100}% of verified seller profit.</p><ul className="mt-4 grid gap-2 text-xs text-gray-600">{item.benefits.map((benefit) => <li key={benefit}>✓ {benefit}</li>)}</ul>{plan !== "free" ? <Button className="mt-5 w-full" variant={selected === plan ? "primary" : "outline"} onClick={() => setSelected(plan as (typeof paidPlans)[number])}>Choose plan</Button> : <p className="mt-5 text-xs text-gray-600">Default when no paid plan is active.</p>}</Card>;
      })}
    </div>
    <Card elevated className="grid gap-6 md:grid-cols-[1fr_auto]">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--color-dusty-rose)]">Activate {selectedPlan.label}</p><h2 className="mt-3 font-display text-4xl text-[var(--color-deep-plum)]">Pay ₹{selectedPlan.monthlyFeePaise / 100}</h2><label className="mt-5 grid gap-2 text-sm font-semibold">UTR / payment reference<input value={reference} onChange={(event) => setReference(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3" /></label><Button className="mt-4" loading={busy} onClick={async () => { setBusy(true); setMessage(""); try { await submitSellerSubscriptionRequest({ studioId, sellerUid, plan: selected, paymentReference: reference }); setReference(""); setMessage("Subscription payment submitted. Admin approval is pending."); } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Request could not be submitted."); } finally { setBusy(false); } }}>Submit for admin approval</Button></div>
      <UpiPaymentQr upiId="tradewithsyed@ybl" payeeName="Sidra" amountPaise={selectedPlan.monthlyFeePaise} reference={`${studioId} ${selected}`} />
    </Card>
    {latest ? <Card><p className="text-sm">Latest request: <strong>{settings.plans.find((plan) => plan.id === latest.plan)?.label ?? latest.plan}</strong> · <strong>{latest.status}</strong></p>{latest.adminNote ? <p className="mt-2 text-sm text-gray-700">{latest.adminNote}</p> : null}</Card> : null}
    {message ? <p className="rounded-2xl border border-black/10 bg-white p-4 text-sm">{message}</p> : null}
  </div>;
}

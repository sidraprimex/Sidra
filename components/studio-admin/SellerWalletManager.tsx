"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { requestSellerWithdrawal } from "@/services/sellerWithdrawalService";
import type { SellerPayout, SellerWithdrawal, WithdrawalMethod } from "@/types/phase7-orders";
import { formatInr } from "@/utils/cartTotals";

export function SellerWalletManager({ studioId, payouts, withdrawals, onReload }: {
  readonly studioId: string;
  readonly payouts: readonly SellerPayout[];
  readonly withdrawals: readonly SellerWithdrawal[];
  readonly onReload: () => Promise<void>;
}): React.JSX.Element {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<WithdrawalMethod>("upi");
  const [destination, setDestination] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const totals = useMemo(() => {
    const earned = payouts.reduce((sum, item) => sum + item.sellerAmountPaise, 0);
    const pending = payouts.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.sellerAmountPaise, 0);
    const released = payouts.filter((item) => item.status === "available").reduce((sum, item) => sum + item.sellerAmountPaise, 0);
    const reserved = withdrawals.filter((item) => ["pending", "processing", "paid"].includes(item.status)).reduce((sum, item) => sum + item.amountPaise, 0);
    const paid = withdrawals.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amountPaise, 0);
    return { earned, pending, available: Math.max(0, released - reserved), paid };
  }, [payouts, withdrawals]);
  const submit = async () => {
    setBusy(true); setMessage(null);
    try {
      await requestSellerWithdrawal({ studioId, amountPaise: Math.round(Number(amount) * 100), method, destination });
      setAmount(""); setDestination({}); setMessage("Withdrawal request submitted for admin payment.");
      await onReload();
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Withdrawal request failed."); }
    finally { setBusy(false); }
  };
  const inputClass = "rounded-2xl border border-black/10 bg-white px-4 py-3";
  return <div className="grid gap-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Available", totals.available], ["Pending earnings", totals.pending], ["Total earnings", totals.earned], ["Withdrawn", totals.paid]].map(([label, value]) => <Card key={String(label)} elevated><p className="text-xs uppercase tracking-[.16em] text-muted">{label}</p><p className="mt-3 font-heading text-3xl">{formatInr(Number(value))}</p></Card>)}</div>
    <Card elevated><h2 className="font-heading text-3xl">Withdraw earnings</h2><p className="mt-2 text-sm text-muted">Minimum ₹500. Admin pays manually and adds the UTR/reference.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">Amount (₹)<input type="number" min="500" max={totals.available / 100} value={amount} onChange={(event) => setAmount(event.target.value)} className={inputClass} /></label>
        <label className="grid gap-2 text-sm">Payment method<select value={method} onChange={(event) => { setMethod(event.target.value as WithdrawalMethod); setDestination({}); }} className={inputClass}><option value="upi">UPI</option><option value="bank">Bank transfer</option><option value="imps">IMPS</option></select></label>
        {method === "upi" ? <label className="grid gap-2 text-sm md:col-span-2">UPI ID<input value={destination.upiId ?? ""} onChange={(event) => setDestination({ upiId: event.target.value })} placeholder="name@bank" className={inputClass} /></label> : <>
          <label className="grid gap-2 text-sm">Account holder<input value={destination.accountHolderName ?? ""} onChange={(event) => setDestination((current) => ({ ...current, accountHolderName: event.target.value }))} className={inputClass} /></label>
          <label className="grid gap-2 text-sm">Bank name<input value={destination.bankName ?? ""} onChange={(event) => setDestination((current) => ({ ...current, bankName: event.target.value }))} className={inputClass} /></label>
          <label className="grid gap-2 text-sm">Account number<input inputMode="numeric" value={destination.accountNumber ?? ""} onChange={(event) => setDestination((current) => ({ ...current, accountNumber: event.target.value }))} className={inputClass} /></label>
          <label className="grid gap-2 text-sm">IFSC<input value={destination.ifsc ?? ""} onChange={(event) => setDestination((current) => ({ ...current, ifsc: event.target.value.toUpperCase() }))} className={`${inputClass} uppercase`} /></label>
        </>}
      </div>{message ? <p className="mt-4 text-sm">{message}</p> : null}
      <Button className="mt-5" loading={busy} disabled={!amount || Number(amount) * 100 > totals.available} onClick={() => void submit()}>Request withdrawal</Button>
    </Card>
    <Card elevated><h2 className="font-heading text-3xl">Withdrawal history</h2><div className="mt-4 grid gap-3">{withdrawals.length === 0 ? <p className="text-sm text-muted">No withdrawal requests yet.</p> : withdrawals.map((item) => <div key={item.withdrawalId} className="grid gap-2 rounded-2xl border border-black/10 bg-white p-4 sm:grid-cols-4"><span>{formatInr(item.amountPaise)}</span><span className="uppercase">{item.method}</span><span className="capitalize">{item.status}</span><span className="break-all text-xs">{item.paymentReference ? `UTR: ${item.paymentReference}` : item.adminNote ?? "Awaiting admin"}</span></div>)}</div></Card>
  </div>;
}

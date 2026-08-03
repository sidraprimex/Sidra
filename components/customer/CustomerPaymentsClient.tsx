"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AccountShell } from "@/components/account/AccountShell";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { listManualPaymentRequests, type ManualPaymentRecord } from "@/services/paymentConfigurationService";
import { formatInr } from "@/utils/cartTotals";
export function CustomerPaymentsClient(): React.JSX.Element {
  const auth=useRouteGuard(); const [items,setItems]=useState<readonly ManualPaymentRecord[]|null>(null);
  useEffect(()=>{if(auth.user)void listManualPaymentRequests(auth.user.uid).then(setItems).catch(()=>setItems([]));},[auth.user]);
  if(auth.loading||!auth.user||!items)return <LoadingSkeleton count={5}/>;
  return <AccountShell mode="customer" eyebrow="Saved verification history" title="Payment status"><div className="grid gap-4">{items.length===0?<div className="rounded-3xl border border-border bg-white/70 p-10 text-center">No payment submissions yet.</div>:items.map(item=><article key={item.requestId} className="rounded-3xl border border-border bg-white/75 p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-[.18em] text-muted">UTR {item.paymentReference}</p><h2 className="mt-2 font-heading text-3xl">{formatInr(item.totalPaise)}</h2></div><span className="rounded-full border border-border px-4 py-2 text-sm font-semibold">{item.status==="verified"?"Approved":item.status==="rejected"?"Rejected":"Pending verification"}</span></div><div className="mt-5 flex flex-wrap gap-3">{item.orderIds.map(orderId=><Link key={orderId} href={`/account/orders/${orderId}`} className="rounded-full bg-[var(--color-deep-plum)] px-5 py-3 text-sm text-white">Open order</Link>)}{item.status==="rejected"?<Link href="/account/support" className="rounded-full border border-border px-5 py-3 text-sm">Contact support</Link>:null}</div></article>)}</div></AccountShell>;
}

"use client";

import { useEffect, useState } from "react";
import { subscribeCustomOrder } from "@/services/customOrderService";
import { canCustomerPayCustomOrder, canSellerSendQuote, canSubmitProof, isCustomOrderChatUnlocked } from "@/utils/customOrderLifecycle";
import { CustomOrderConversation } from "@/components/custom-orders/CustomOrderConversation";
import { CustomOrderQuoteCard } from "@/components/custom-orders/CustomOrderQuoteCard";
import { SellerQuoteForm } from "@/components/custom-orders/SellerQuoteForm";
import { ProofApprovalPanel } from "@/components/custom-orders/ProofApprovalPanel";
import type { CustomOrder } from "@/types/phase8-custom-orders";

export function CustomOrderDetailClient({
  customOrderId,
  role,
}: {
  readonly customOrderId: string;
  readonly role: "customer" | "seller";
}): React.JSX.Element {
  const [order, setOrder] = useState<CustomOrder | null>(null);
  useEffect(() => subscribeCustomOrder(customOrderId, setOrder), [customOrderId]);

  if (!order) {
    return <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-muted">Loading custom order…</div>;
  }

  return <section className="grid gap-8">
    <header>
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">{order.status}</p>
      <h1 className="mt-3 font-heading text-[clamp(3rem,8vw,6rem)]">{order.brief.title}</h1>
      <p className="mt-4 max-w-3xl leading-7 text-muted">{order.brief.description}</p>
      <div className="mt-5 flex flex-wrap gap-3 text-xs">
        <span className="rounded-full border border-border px-3 py-1">
          Payment: {order.paymentStatus}
        </span>
        <span className="rounded-full border border-border px-3 py-1">
          Chat: {order.chatUnlocked ? "unlocked" : "locked"}
        </span>
      </div>
    </header>
    <div className="grid gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-6 sm:grid-cols-2">
      <div><p className="text-xs uppercase tracking-[0.16em] text-muted">Studio</p><p className="mt-2">{order.studioName}</p></div>
      <div><p className="text-xs uppercase tracking-[0.16em] text-muted">Target delivery</p><p className="mt-2">{order.brief.targetDeliveryDate}</p></div>
      <div><p className="text-xs uppercase tracking-[0.16em] text-muted">Dimensions</p><p className="mt-2">{order.brief.dimensions}</p></div>
      <div><p className="text-xs uppercase tracking-[0.16em] text-muted">Personalisation</p><p className="mt-2">{order.brief.personalizationText || "None"}</p></div>
    </div>
    {order.quote ? <CustomOrderQuoteCard customOrderId={order.customOrderId} quote={order.quote} canAccept={role === "customer" && canCustomerPayCustomOrder(order.status)} paymentStatus={order.paymentStatus} paymentReference={order.paymentReference} /> : null}
    {role === "seller" && canSellerSendQuote(order.status) ? <SellerQuoteForm customOrderId={order.customOrderId} /> : null}
    {(order.proofs.length > 0 || (role === "seller" && canSubmitProof(order.status))) ? <ProofApprovalPanel customOrderId={order.customOrderId} proofs={order.proofs} role={role} /> : null}
    <CustomOrderConversation customOrderId={order.customOrderId} legacyMessages={order.messages} unlocked={order.chatUnlocked && isCustomOrderChatUnlocked(order.status)} />
  </section>;
}

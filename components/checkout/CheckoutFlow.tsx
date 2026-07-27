"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateCheckoutDraft, formatInr } from "@/utils/cartTotals";
import { getCart } from "@/services/cartSyncService";
import { listAddresses } from "@/services/addressBookService";
import { initiatePayment, loadRazorpay } from "@/services/checkoutService";
import type { CustomerCart, ShippingAddress } from "@/types/phase6-commerce";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const steps = ["Shipping address", "Delivery & review", "Payment", "Confirmation"] as const;

export function CheckoutFlow({ userId }: { readonly userId: string }): React.JSX.Element {
  const [step, setStep] = useState(0);
  const [cart, setCart] = useState<CustomerCart>({ userId, items: [], currency: "INR", updatedAt: "" });
  const [addresses, setAddresses] = useState<readonly ShippingAddress[]>([]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [checkoutReference, setCheckoutReference] = useState<string | null>(null);
  const draft = useMemo(() => ({ ...calculateCheckoutDraft(cart.items), addressId }), [cart.items, addressId]);

  useEffect(() => {
    void Promise.all([getCart(userId), listAddresses(userId)]).then(([nextCart, nextAddresses]) => {
      setCart(nextCart);
      setAddresses(nextAddresses);
      setAddressId(nextAddresses.find((item) => item.isDefault)?.id ?? nextAddresses[0]?.id ?? null);
    });
  }, [userId]);

  const pay = async () => {
    setProcessing(true);
    try {
      await loadRazorpay();
      const session = await initiatePayment(draft, userId);
      setCheckoutReference(session.checkoutReference);
      if (!window.Razorpay) throw new Error("Payment gateway unavailable.");
      const gateway = new window.Razorpay({
        key: session.publicKey,
        amount: session.amountPaise,
        currency: session.currency,
        order_id: session.gatewayOrderId,
        name: "SIDRA",
        description: "Verified marketplace payment",
        handler: () => setStep(3),
        modal: { ondismiss: () => setProcessing(false) },
      });
      gateway.open();
    } finally {
      setProcessing(false);
    }
  };

  return <section className="grid gap-8">
    <header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Exactly four steps</p><h1 className="mt-3 font-heading text-[clamp(3rem,8vw,6rem)]">Checkout</h1><ol className="mt-6 grid gap-3 sm:grid-cols-4">{steps.map((label, index) => <li key={label} className={`rounded-[var(--radius-md)] border p-3 text-sm ${step === index ? "border-[var(--color-gold-600)]" : "border-border"}`}>{index + 1}. {label}</li>)}</ol></header>

    {step === 0 ? <div className="grid gap-4"><h2 className="font-heading text-3xl">Shipping address</h2>{addresses.map((address) => <label key={address.id} className="rounded-[var(--radius-lg)] border border-border bg-card p-5"><input type="radio" name="address" checked={addressId === address.id} onChange={() => setAddressId(address.id)} /> <span className="ml-2">{address.name}, {address.line1}, {address.city}, {address.postalCode}</span></label>)}<button disabled={!addressId} className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50" onClick={() => setStep(1)}>Continue</button></div> : null}

    {step === 1 ? <div className="grid gap-5"><h2 className="font-heading text-3xl">Delivery and order review</h2>{draft.studioCount > 1 ? <div className="rounded-[var(--radius-lg)] border border-[var(--color-warning)] bg-card p-5 text-sm">Your order will be split into {draft.shipmentCount} shipments from {draft.studioCount} Studios.</div> : null}<div className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><div className="flex justify-between"><span>Subtotal</span><span>{formatInr(draft.subtotalPaise)}</span></div><div className="mt-3 flex justify-between"><span>Shipping</span><span>{formatInr(draft.shippingPaise)}</span></div><div className="mt-5 flex justify-between border-t border-border pt-5 font-heading text-2xl"><span>Total</span><span>{formatInr(draft.totalPaise)}</span></div></div><div className="rounded-[var(--radius-md)] border border-border bg-card p-4 text-sm text-muted">Available discounts are validated securely before payment. No unverified discount is applied.</div><button className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white" onClick={() => setStep(2)}>Continue to payment</button></div> : null}

    {step === 2 ? <div className="grid gap-5"><h2 className="font-heading text-3xl">Secure payment</h2><p className="max-w-2xl leading-7 text-muted">SIDRA never receives or stores raw card details. Payment is handled by the gateway’s hosted checkout.</p><button disabled={processing} className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50" onClick={() => void pay()}>{processing ? "Opening secure checkout…" : `Pay ${formatInr(draft.totalPaise)}`}</button></div> : null}

    {step === 3 ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-8"><h2 className="font-heading text-3xl">Payment received by gateway</h2><p className="mt-3 leading-7 text-muted">We are waiting for the verified server webhook before showing an order confirmation.</p>{checkoutReference ? <a className="mt-6 inline-flex rounded-[var(--radius-md)] border border-border px-5 py-3" href={`/order/${checkoutReference}/confirmation`}>Check verified order status</a> : null}</div> : null}
  </section>;
}

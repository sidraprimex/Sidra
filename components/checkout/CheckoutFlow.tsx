"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateCheckoutDraft, formatInr } from "@/utils/cartTotals";
import { getCart } from "@/services/cartSyncService";
import { listAddresses } from "@/services/addressBookService";
import { initiatePayment, loadRazorpay } from "@/services/checkoutService";
import {
  createManualPaymentRequest,
  defaultPaymentSettings,
  getCheckoutPaymentSettings,
} from "@/services/paymentConfigurationService";
import type { CustomerCart, ShippingAddress } from "@/types/phase6-commerce";
import type { CheckoutPaymentSettings } from "@/types/payment-settings";

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
  const [confirmationMode, setConfirmationMode] = useState<"gateway" | "manual" | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<CheckoutPaymentSettings>(defaultPaymentSettings);
  const [manualReference, setManualReference] = useState("");
  const [error, setError] = useState<string | null>(null);
  const draft = useMemo(() => ({ ...calculateCheckoutDraft(cart.items), addressId }), [cart.items, addressId]);

  useEffect(() => {
    void Promise.all([getCart(userId), listAddresses(userId), getCheckoutPaymentSettings()]).then(([nextCart, nextAddresses, settings]) => {
      setCart(nextCart);
      setAddresses(nextAddresses);
      setPaymentSettings(settings);
      setAddressId(nextAddresses.find((item) => item.isDefault)?.id ?? nextAddresses[0]?.id ?? null);
    });
  }, [userId]);

  const payWithRazorpay = async () => {
    setProcessing(true);
    setError(null);
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
        handler: () => { setConfirmationMode("gateway"); setStep(3); },
        modal: { ondismiss: () => setProcessing(false) },
      });
      gateway.open();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Payment gateway could not be opened.");
    } finally {
      setProcessing(false);
    }
  };

  const submitManualPayment = async () => {
    if (!addressId) return;
    if (manualReference.trim().length < 4) {
      setError("Enter the UPI UTR or bank transaction reference after completing the transfer.");
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const requestId = await createManualPaymentRequest({
        userId,
        addressId,
        cart,
        checkout: draft,
        paymentReference: manualReference,
      });
      setCheckoutReference(requestId);
      setConfirmationMode("manual");
      setStep(3);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Manual payment request could not be submitted.");
    } finally {
      setProcessing(false);
    }
  };

  const razorpayVisible = paymentSettings.mode === "razorpay" || paymentSettings.mode === "hybrid";
  const manualVisible = paymentSettings.mode === "manual" || paymentSettings.mode === "hybrid";

  return <section className="grid gap-8">
    <header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Exactly four steps</p><h1 className="mt-3 font-heading text-[clamp(3rem,8vw,6rem)]">Checkout</h1><ol className="mt-6 grid gap-3 sm:grid-cols-4">{steps.map((label, index) => <li key={label} className={`rounded-[var(--radius-md)] border p-3 text-sm ${step === index ? "border-[var(--color-gold-600)]" : "border-border"}`}>{index + 1}. {label}</li>)}</ol></header>

    {step === 0 ? <div className="grid gap-4"><h2 className="font-heading text-3xl">Shipping address</h2>{addresses.map((address) => <label key={address.id} className="rounded-[var(--radius-lg)] border border-border bg-card p-5"><input type="radio" name="address" checked={addressId === address.id} onChange={() => setAddressId(address.id)} /> <span className="ml-2">{address.name}, {address.line1}, {address.city}, {address.postalCode}</span></label>)}<button disabled={!addressId} className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50" onClick={() => setStep(1)}>Continue</button></div> : null}

    {step === 1 ? <div className="grid gap-5"><h2 className="font-heading text-3xl">Delivery and order review</h2>{draft.studioCount > 1 ? <div className="rounded-[var(--radius-lg)] border border-[var(--color-warning)] bg-card p-5 text-sm">Your order will be split into {draft.shipmentCount} shipments from {draft.studioCount} Studios.</div> : null}<div className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><div className="flex justify-between"><span>Subtotal</span><span>{formatInr(draft.subtotalPaise)}</span></div><div className="mt-3 flex justify-between"><span>Shipping</span><span>{formatInr(draft.shippingPaise)}</span></div><div className="mt-5 flex justify-between border-t border-border pt-5 font-heading text-2xl"><span>Total</span><span>{formatInr(draft.totalPaise)}</span></div></div><div className="rounded-[var(--radius-md)] border border-border bg-card p-4 text-sm text-muted">Available discounts are validated securely before payment. No unverified discount is applied.</div><button className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white" onClick={() => setStep(2)}>Continue to payment</button></div> : null}

    {step === 2 ? <div className="grid gap-6"><h2 className="font-heading text-3xl">Payment</h2>{paymentSettings.mode === "disabled" ? <div className="rounded-[var(--radius-lg)] border border-[var(--color-warning)] bg-card p-6"><h3 className="font-heading text-2xl">Payments are temporarily paused</h3><p className="mt-3 text-sm leading-7 text-muted">Contact {paymentSettings.supportContact || "Sidra Support"} before placing this order.</p></div> : null}{razorpayVisible && paymentSettings.razorpayEnabled ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--color-gold-600)]">Razorpay</p><h3 className="mt-2 font-heading text-3xl">Secure hosted checkout</h3><p className="mt-3 max-w-2xl leading-7 text-muted">SIDRA never receives or stores raw card details. Payment is handled by the gateway.</p><button disabled={processing} className="mt-5 rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50" onClick={() => void payWithRazorpay()}>{processing ? "Opening secure checkout…" : `Pay ${formatInr(draft.totalPaise)}`}</button></div> : null}{manualVisible && paymentSettings.manualEnabled ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--color-gold-600)]">Manual verification</p><h3 className="mt-2 font-heading text-3xl">Pay by UPI or bank transfer</h3><dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-semibold">UPI ID</dt><dd className="mt-1 break-all text-muted">{paymentSettings.upiId || "Not configured"}</dd></div><div><dt className="font-semibold">Account holder</dt><dd className="mt-1 text-muted">{paymentSettings.accountHolderName || "Not configured"}</dd></div><div><dt className="font-semibold">Bank</dt><dd className="mt-1 text-muted">{paymentSettings.bankName || "Not configured"}</dd></div><div><dt className="font-semibold">Account / IFSC</dt><dd className="mt-1 break-all text-muted">{paymentSettings.accountNumber || "—"} · {paymentSettings.ifsc || "—"}</dd></div></dl>{paymentSettings.instructions ? <p className="mt-5 rounded-[var(--radius-md)] border border-border p-4 text-sm leading-7 text-muted">{paymentSettings.instructions}</p> : null}<label className="mt-5 grid gap-2 text-sm font-semibold">UTR / transaction reference<input value={manualReference} onChange={(event) => setManualReference(event.target.value)} className="rounded-[var(--radius-md)] border border-border bg-white px-4 py-3" placeholder="Example: 312345678901" /></label><button disabled={processing} className="mt-5 rounded-[var(--radius-md)] bg-[var(--color-deep-plum)] px-5 py-3 text-white disabled:opacity-50" onClick={() => void submitManualPayment()}>{processing ? "Submitting…" : "Submit for admin verification"}</button></div> : null}{error ? <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}</div> : null}

    {step === 3 ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-8"><h2 className="font-heading text-3xl">{confirmationMode === "manual" ? "Payment submitted for verification" : "Payment received by gateway"}</h2><p className="mt-3 leading-7 text-muted">{confirmationMode === "manual" ? "Your UTR is now visible inside the Sidra Admin OS. The admin can verify or reject it, and the status remains stored in Firebase." : "We are waiting for the verified server webhook before showing an order confirmation."}</p>{checkoutReference ? <p className="mt-5 rounded-[var(--radius-md)] border border-border p-4 text-sm">Reference: <strong>{checkoutReference}</strong></p> : null}{confirmationMode === "gateway" && checkoutReference ? <a className="mt-6 inline-flex rounded-[var(--radius-md)] border border-border px-5 py-3" href={`/order/${checkoutReference}/confirmation`}>Check verified order status</a> : null}{confirmationMode === "manual" ? <a className="mt-6 inline-flex rounded-[var(--radius-md)] border border-border px-5 py-3" href="/account/dashboard">Return to your account</a> : null}</div> : null}
  </section>;
}

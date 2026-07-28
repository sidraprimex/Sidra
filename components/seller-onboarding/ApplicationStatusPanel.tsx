"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { getCheckoutPaymentSettings } from "@/services/paymentConfigurationService";
import { submitSellerAccessPayment, watchOwnSellerApplication } from "@/services/sellerApplicationService";
import type { CheckoutPaymentSettings } from "@/types/payment-settings";
import type { SellerAccessPaymentMethod, SellerApplication } from "@/types/seller-application";

const statusCopy: Record<SellerApplication["status"], { label: string; message: string; tone: string; step: number }> = {
  pending: { label: "Pending admin review", message: "Your Studio application is safely submitted and waiting for admin review.", tone: "bg-amber-100 text-amber-900", step: 1 },
  approved: { label: "Approved - payment required", message: "Your application is approved. Complete the Studio access payment below.", tone: "bg-emerald-100 text-emerald-900", step: 2 },
  paymentSubmitted: { label: "Payment verification pending", message: "Your payment reference was submitted. Admin verification is now pending.", tone: "bg-blue-100 text-blue-900", step: 3 },
  provisioning: { label: "Studio setup in progress", message: "Your Studio and seller access are being prepared.", tone: "bg-blue-100 text-blue-900", step: 4 },
  provisioned: { label: "Studio ready", message: "Payment is verified and your seller permissions are active.", tone: "bg-emerald-100 text-emerald-900", step: 5 },
  rejected: { label: "Application rejected", message: "The admin did not approve this request. Review the note below.", tone: "bg-rose-100 text-rose-900", step: 1 },
  moreInfoRequested: { label: "More information required", message: "The admin needs more details before making a decision.", tone: "bg-amber-100 text-amber-900", step: 1 },
  onHold: { label: "On hold", message: "Your request is safely saved and currently on hold.", tone: "bg-slate-200 text-slate-900", step: 1 },
  provisioningFailed: { label: "Setup needs attention", message: "Studio setup needs admin attention.", tone: "bg-rose-100 text-rose-900", step: 4 },
};

function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);
}

export function ApplicationStatusPanel({ uid, onPresenceChange }: { uid: string; onPresenceChange?: (present: boolean) => void }) {
  const { refresh } = useAuth();
  const [application, setApplication] = useState<SellerApplication | null>(null);
  const [settings, setSettings] = useState<CheckoutPaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<SellerAccessPaymentMethod>("manual");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void getCheckoutPaymentSettings().then((value) => {
      setSettings(value);
      if (!value.manualEnabled && value.razorpayEnabled && value.razorpayPaymentLink) {
        setMethod("razorpayLink");
      }
    }).catch(() => setSettings(null));
  }, []);

  useEffect(
    () => watchOwnSellerApplication(uid, (value) => {
      setApplication(value);
      setLoading(false);
      onPresenceChange?.(Boolean(value));
      if (value?.status === "provisioned") void refresh();
    }, (caught) => {
      setError(caught.message);
      setLoading(false);
    }),
    [onPresenceChange, refresh, uid],
  );

  const current = useMemo(() => application ? statusCopy[application.status] : null, [application]);
  if (loading) return <LoadingSkeleton count={3} />;
  if (error) return <ErrorState message={error} />;
  if (!application || !current) return null;

  const manualAvailable = Boolean(settings?.manualEnabled);
  const razorpayLinkAvailable = Boolean(settings?.razorpayEnabled && settings.razorpayPaymentLink);
  const fee = application.accessFeePaise || settings?.sellerAccessFeePaise || 0;

  return (
    <div className="grid gap-6">
      <Card id="studio-application-status" elevated className="border-gold-500/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-600">Studio application</p>
            <h1 className="mt-3 font-display text-h1">{application.studioName}</h1>
          </div>
          <span className={`rounded-full px-4 py-2 text-xs font-semibold ${current.tone}`}>{current.label}</span>
        </div>
        <div className="mt-6 grid grid-cols-5 gap-2" aria-label={`Application step ${current.step} of 5`}>
          {[1, 2, 3, 4, 5].map((step) => <span key={step} className={`h-2 rounded-full ${step <= current.step ? "bg-[var(--color-deep-plum)]" : "bg-black/10"}`} />)}
        </div>
        <p className="mt-5 text-body text-gray-700">{current.message}</p>
        {application.reviewNote ? <div className="mt-5 rounded-2xl border border-gold-500/20 bg-gold-100/60 p-4"><p className="text-xs font-semibold uppercase tracking-[.18em]">Admin note</p><p className="mt-2 text-caption text-black-900">{application.reviewNote}</p></div> : null}
      </Card>

      {application.status === "approved" ? (
        <Card elevated>
          <p className="text-micro font-semibold uppercase tracking-[.2em] text-gold-600">Studio access payment</p>
          <h2 className="mt-3 font-display text-h1">{fee > 0 ? formatInr(fee) : "Fee pending"}</h2>
          {fee <= 0 ? <p className="mt-4 text-caption leading-7 text-gray-700">Admin has approved your application but has not published the Studio access fee yet.</p> : null}

          {manualAvailable ? <div className="mt-6 rounded-2xl border border-black/10 bg-white/70 p-5"><p className="font-semibold">Manual UPI / bank transfer</p><dl className="mt-4 grid gap-3 text-caption sm:grid-cols-2"><div><dt className="font-semibold">UPI ID</dt><dd className="mt-1 break-all text-gray-700">{settings?.upiId || "Not configured"}</dd></div><div><dt className="font-semibold">Account holder</dt><dd className="mt-1 text-gray-700">{settings?.accountHolderName || "Not configured"}</dd></div><div><dt className="font-semibold">Bank</dt><dd className="mt-1 text-gray-700">{settings?.bankName || "Not configured"}</dd></div><div><dt className="font-semibold">Account / IFSC</dt><dd className="mt-1 break-all text-gray-700">{settings?.accountNumber || "-"} / {settings?.ifsc || "-"}</dd></div></dl>{settings?.instructions ? <p className="mt-4 text-caption leading-7 text-gray-700">{settings.instructions}</p> : null}</div> : null}

          {razorpayLinkAvailable ? <a href={settings?.razorpayPaymentLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--color-deep-plum)] px-5 py-3 text-sm font-semibold text-white">Open secure Razorpay payment</a> : null}

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold">Payment method<select value={method} onChange={(event) => setMethod(event.target.value as SellerAccessPaymentMethod)} className="rounded-2xl border border-black/10 bg-white px-4 py-3"><option value="manual" disabled={!manualAvailable}>Manual UPI / bank</option><option value="razorpayLink" disabled={!razorpayLinkAvailable}>Razorpay payment link</option></select></label>
            <label className="grid gap-2 text-sm font-semibold">UTR / payment reference<input value={reference} onChange={(event) => setReference(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3" placeholder="Enter transaction or Razorpay reference" /></label>
            {error ? <ErrorState message={error} /> : null}
            <Button loading={submitting} disabled={fee <= 0 || (!manualAvailable && !razorpayLinkAvailable)} onClick={async () => {
              setSubmitting(true);
              setError(null);
              try {
                await submitSellerAccessPayment({ uid, applicationId: application.id, method, reference });
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Payment reference could not be submitted.");
              } finally {
                setSubmitting(false);
              }
            }}>Submit payment for verification</Button>
          </div>
        </Card>
      ) : null}

      {application.status === "paymentSubmitted" ? <Card elevated><p className="text-caption leading-7 text-gray-700">Payment method: <strong>{application.paymentMethod === "razorpayLink" ? "Razorpay" : "Manual transfer"}</strong><br />Reference: <strong>{application.paymentReference}</strong><br />Admin verification will unlock your Studio dashboard.</p></Card> : null}

      <div className="flex flex-wrap gap-3">
        {application.status === "provisioned" ? <Link className="inline-flex min-h-12 items-center rounded-full bg-[var(--color-deep-plum)] px-5 py-3 text-caption font-semibold text-white" href="/studio-admin/overview">Enter Studio dashboard</Link> : null}
        <Link className="inline-flex min-h-12 items-center rounded-full border border-[var(--color-deep-plum)] px-5 py-3 text-caption font-semibold text-[var(--color-deep-plum)]" href="/account/dashboard">Buyer dashboard</Link>
        <Link className="inline-flex min-h-12 items-center rounded-full border border-black/10 px-5 py-3 text-caption font-semibold" href="/">Marketplace home</Link>
      </div>
    </div>
  );
}

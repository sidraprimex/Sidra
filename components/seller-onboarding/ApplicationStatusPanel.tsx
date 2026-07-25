"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { watchOwnSellerApplication } from "@/services/sellerApplicationService";
import type { SellerApplication } from "@/types/seller-application";

export function ApplicationStatusPanel({ uid, onPresenceChange }: { uid: string; onPresenceChange?: (present: boolean) => void }) {
  const { refresh } = useAuth();
  const [application, setApplication] = useState<SellerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => watchOwnSellerApplication(uid, (value) => {
    setApplication(value); setLoading(false); onPresenceChange?.(Boolean(value));
    if (value?.status === "provisioned") void refresh();
  }, (caught) => { setError(caught.message); setLoading(false); }), [onPresenceChange, refresh, uid]);
  if (loading) return <LoadingSkeleton count={2} />;
  if (error) return <ErrorState message={error} />;
  if (!application) return null;
  const messages: Record<SellerApplication["status"], string> = {
    pending: "Your Studio access request is awaiting Founder review.",
    approved: "Approved. Automatic Studio provisioning is beginning.",
    provisioning: "Your Studio, secure storage, analytics and access are being provisioned.",
    provisioned: "Your Studio is ready and your seller permissions are active.",
    rejected: "This request was not approved.",
    moreInfoRequested: "The Founder requested more information before a decision.",
    onHold: "This request is currently on hold.",
    provisioningFailed: "Provisioning was rolled back safely. The Founder has been alerted.",
  };
  return <Card elevated className="border-gold-500/30">
    <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-600">Studio access</p>
    <h2 className="mt-3 font-display text-h2">{application.studioName}</h2>
    <p className="mt-3 text-body text-gray-700">{messages[application.status]}</p>
    {application.reviewNote ? <p className="mt-4 rounded-sm bg-gold-100 p-4 text-caption text-black-900">{application.reviewNote}</p> : null}
    {application.status === "provisioned" ? <Link className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-5 py-3 text-caption font-semibold text-black-900" href="/studio-admin/overview">Enter the Studio dashboard</Link> : null}
  </Card>;
}

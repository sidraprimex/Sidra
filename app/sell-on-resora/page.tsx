"use client";
import Link from "next/link";
import { useState } from "react";
import { ApplicationStatusPanel } from "@/components/seller-onboarding/ApplicationStatusPanel";
import { SellerApplicationForm } from "@/components/seller-onboarding/SellerApplicationForm";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";

export default function SellOnResoraPage() {
  const { user, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [hasApplication, setHasApplication] = useState<boolean | null>(null);
  if (loading) return <main className="mx-auto min-h-screen max-w-5xl px-5 py-10 sm:px-8"><LoadingSkeleton count={3} /></main>;
  return <main className="min-h-screen bg-ivory-100 px-5 py-10 sm:px-8 lg:py-16">
    <div className="mx-auto max-w-5xl">
      <p className="text-micro font-semibold uppercase tracking-[0.22em] text-gold-600">Curated Studio access</p>
      <h1 className="mt-3 max-w-3xl font-display text-h1">Present your craft to Sidra.</h1>
      <p className="mt-4 max-w-2xl text-body-lg text-gray-700">Every Studio is reviewed for craftsmanship, photography and brand fit. Approval provisions the complete Studio automatically.</p>
      <div className="mt-8">
        {!user ? <section className="rounded-lg border border-gray-100 bg-ivory-50 p-8 shadow-card"><h2 className="font-display text-h2">Sign in before requesting access.</h2><p className="mt-3 text-caption text-gray-700">Your verified account securely owns the submitted portfolio and future Studio.</p><Link href="/login?next=/sell-on-resora" className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-5 py-3 text-caption font-semibold text-black-900">Continue to sign in</Link></section>
        : !user.emailVerified ? <section className="rounded-lg border border-gray-100 bg-ivory-50 p-8 shadow-card"><h2 className="font-display text-h2">Confirm your email before requesting access.</h2><p className="mt-3 text-caption text-gray-700">Email verification protects your portfolio and the Studio identity provisioned after approval.</p><Link href="/verify-email?next=/sell-on-resora" className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-5 py-3 text-caption font-semibold text-black-900">Continue to verification</Link></section>
        : submitted ? <ApplicationStatusPanel uid={user.uid} onPresenceChange={setHasApplication} /> : <><ApplicationStatusPanel uid={user.uid} onPresenceChange={setHasApplication} />{hasApplication === false ? <div className="mt-8"><SellerApplicationForm uid={user.uid} email={user.email ?? ""} onSubmitted={() => setSubmitted(true)} /></div> : null}</>}
      </div>
    </div>
  </main>;
}

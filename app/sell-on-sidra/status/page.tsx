"use client";

import Link from "next/link";
import { ApplicationStatusPanel } from "@/components/seller-onboarding/ApplicationStatusPanel";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";

export default function SellerApplicationStatusPage(): React.JSX.Element {
  const { user, loading } = useAuth();
  if (loading) return <main className="min-h-screen bg-[var(--color-porcelain)] px-5 pb-20 pt-28"><div className="mx-auto max-w-4xl"><LoadingSkeleton count={4} /></div></main>;
  if (!user) return <main className="min-h-screen bg-[var(--color-porcelain)] px-5 pb-20 pt-28"><div className="mx-auto max-w-3xl rounded-[var(--radius-lg)] border border-black/10 bg-white p-8"><h1 className="font-display text-5xl text-[var(--color-deep-plum)]">Sign in to track your Studio</h1><Link href="/login?next=/sell-on-sidra/status" className="mt-6 inline-flex rounded-full bg-[var(--color-deep-plum)] px-6 py-3 font-semibold text-white">Sign in</Link></div></main>;
  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(217,167,176,.2),transparent_35%),linear-gradient(180deg,#fbf8f5,#f4ebe8)] px-5 pb-20 pt-28 sm:px-8"><div className="mx-auto max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[.24em] text-[var(--color-dusty-rose)]">Seller journey</p><h1 className="mt-4 font-display text-[clamp(3.5rem,9vw,7rem)] leading-[.9] text-[var(--color-deep-plum)]">Track your Studio access.</h1><p className="mt-5 max-w-2xl text-base leading-8 text-gray-700">Review status, complete payment after approval and enter your Studio dashboard once admin verifies it.</p><div className="mt-10"><ApplicationStatusPanel uid={user.uid} /></div></div></main>;
}

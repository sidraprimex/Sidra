"use client";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { getPublicStudioRoute, type PublicStudioRoute } from "@/services/publicStudioStatusService";

export default function StudioStatusPage({ params }: { params: Promise<{ slug: string }> }) {
  const [route, setRoute] = useState<PublicStudioRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { void params.then(({ slug }) => getPublicStudioRoute(slug)).then(setRoute).catch((caught) => setError(caught instanceof Error ? caught.message : "Studio status unavailable.")).finally(() => setLoading(false)); }, [params]);
  if (loading) return <main className="mx-auto min-h-screen max-w-5xl px-5 py-10"><LoadingSkeleton count={3} /></main>;
  if (error) return <main className="mx-auto min-h-screen max-w-5xl px-5 py-10"><ErrorState message={error} /></main>;
  if (!route || route.unavailableMode === "notFound" && route.status === "suspended") return <main className="mx-auto min-h-screen max-w-5xl px-5 py-10"><EmptyState title="Studio not found" message="This Studio route is not available." /></main>;
  if (route.status === "suspended") return <main className="flex min-h-screen items-center justify-center bg-black-950 px-5"><section className="max-w-2xl text-center text-ivory-100"><p className="text-micro uppercase tracking-[0.22em] text-gold-500">Sidra Studio</p><h1 className="mt-4 font-display text-h1">Temporarily unavailable.</h1><p className="mt-4 text-body text-gray-300">The Studio and its data remain protected while access is paused.</p></section></main>;
  return <main className="flex min-h-screen items-center justify-center bg-ivory-100 px-5"><section className="max-w-2xl text-center"><p className="text-micro uppercase tracking-[0.22em] text-gold-600">Verified Sidra Studio</p><h1 className="mt-4 font-display text-h1">{route.displayName}</h1><p className="mt-4 text-body text-gray-700">This Studio is active. Its complete public gallery arrives in the locked public-discovery phase.</p></section></main>;
}

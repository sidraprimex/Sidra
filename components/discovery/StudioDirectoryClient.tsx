"use client";

import { useEffect, useMemo, useState } from "react";
import { listPublicStudios } from "@/services/publicDiscoveryService";
import type { PublicStudio } from "@/types/phase5-discovery";
import { StudioCard } from "@/components/discovery/StudioCard";

export function StudioDirectoryClient(): React.JSX.Element {
  const [studios, setStudios] = useState<readonly PublicStudio[]>([]);
  const [location, setLocation] = useState("");
  const [minimumRating, setMinimumRating] = useState(0);
  const [sort, setSort] = useState<"featured" | "rating" | "newest">("featured");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void listPublicStudios({ location, minimumRating, sort })
      .then((value) => { if (active) { setStudios(value); setError(null); } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Studios could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [location, minimumRating, sort]);

  const locations = useMemo(() => [...new Set(studios.map((studio) => studio.location).filter(Boolean))], [studios]);

  return (
    <section className="grid gap-8">
      <header className="max-w-3xl"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Verified independent artists</p><h1 className="mt-3 font-heading text-[clamp(3rem,8vw,6rem)] leading-[0.95]">Studio Directory</h1><p className="mt-5 text-lg leading-8 text-muted">Explore curated Studios creating handcrafted resin objects across India.</p></header>
      <div className="grid gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-5 md:grid-cols-3">
        <label className="grid gap-2 text-sm">Location<select className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={location} onChange={(e) => setLocation(e.target.value)}><option value="">All locations</option>{locations.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="grid gap-2 text-sm">Minimum rating<select className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={minimumRating} onChange={(e) => setMinimumRating(Number(e.target.value))}><option value="0">Any rating</option><option value="4">4.0+</option><option value="4.5">4.5+</option></select></label>
        <label className="grid gap-2 text-sm">Sort<select className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="featured">Featured first</option><option value="rating">Highest rated</option><option value="newest">Newest</option></select></label>
      </div>
      {loading ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="aspect-[4/3] animate-pulse rounded-[var(--radius-lg)] bg-card" />)}</div> : null}
      {error ? <div className="rounded-[var(--radius-lg)] border border-[var(--color-error)] p-6 text-[var(--color-error)]">{error}</div> : null}
      {!loading && !error && studios.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">No verified Studio matches these filters.</div> : null}
      {!loading && !error && studios.length > 0 ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{studios.map((studio) => <StudioCard key={studio.id} studio={studio} />)}</div> : null}
    </section>
  );
}

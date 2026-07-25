"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSearchSuggestions, searchProducts } from "@/services/searchService";
import type { PublicProduct, SearchSuggestion } from "@/types/phase5-discovery";
import { ProductGrid } from "@/components/discovery/ProductGrid";

export function SearchExperience({ initialQuery = "" }: { readonly initialQuery?: string }): React.JSX.Element {
  const [term, setTerm] = useState(initialQuery);
  const [results, setResults] = useState<readonly PublicProduct[]>([]);
  const [suggestions, setSuggestions] = useState<readonly SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (term.trim().length < 2) { setSuggestions([]); setResults([]); return; }
      setLoading(true);
      void Promise.all([getSearchSuggestions(term), searchProducts(term)])
        .then(([nextSuggestions, nextResults]) => { setSuggestions(nextSuggestions); setResults(nextResults); })
        .finally(() => setLoading(false));
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [term]);

  return <section className="grid gap-8"><header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Discover by name, material, Studio, or collection</p><h1 className="mt-3 font-heading text-[clamp(3rem,8vw,6rem)]">Search</h1></header><div className="relative"><input autoFocus className="w-full rounded-[var(--radius-lg)] border border-border bg-card px-5 py-4 text-lg" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search handcrafted pieces" />{suggestions.length > 0 ? <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-[var(--radius-md)] border border-border bg-card shadow-[var(--shadow-elevated)]">{suggestions.map((item) => <Link key={`${item.type}-${item.id}`} href={item.href} className="block border-b border-border px-5 py-3 last:border-0">{item.label}</Link>)}</div> : null}</div>{loading ? <p className="text-sm text-muted">Searching…</p> : null}{!loading && term.trim().length >= 2 && results.length === 0 ? <div className="grid gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-8"><h2 className="font-heading text-3xl">No exact match</h2><p className="text-muted">Try a material, product type, Studio name, or a broader phrase.</p><div className="flex flex-wrap gap-3">{["trays","jewellery","wall art"].map((item) => <Link key={item} href={`/category/${item.replace(" ","-")}`} className="rounded-full border border-border px-4 py-2 text-sm">{item}</Link>)}</div></div> : null}{results.length > 0 ? <ProductGrid products={results} /> : null}</section>;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { listTaxonomy, saveTaxonomy, setTaxonomyActive, type TaxonomyKind } from "@/services/taxonomyManagementService";
import type { TaxonomyRecord } from "@/types/phase4-taxonomy";

export function TaxonomyManager({ kind }: { readonly kind: TaxonomyKind }): React.JSX.Element {
  const [items, setItems] = useState<readonly TaxonomyRecord[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const load = useCallback(async () => {
    setItems(await listTaxonomy(kind));
  }, [kind]);
  useEffect(() => { void load(); }, [load]);
  return (
    <section className="grid gap-7">
      <header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Founder Taxonomy</p><h1 className="mt-2 font-heading text-4xl">{kind === "categories" ? "Categories" : "Collections"}</h1></header>
      <form className="grid gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-6" onSubmit={async (e) => { e.preventDefault(); await saveTaxonomy(kind, { name, description, imageUrl: null, active: true, sortOrder: items.length }); setName(""); setDescription(""); await load(); }}>
        <input required className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <textarea required className="min-h-24 rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <button className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white">Save</button>
      </form>
      <div className="grid gap-3">{items.map((item) => <article key={item.id} className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-border bg-card p-5"><div><h2 className="font-heading text-xl">{item.name}</h2><p className="mt-1 text-sm text-muted">{item.description}</p></div><button className="rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm" onClick={async () => { await setTaxonomyActive(kind, item.id, !item.active); await load(); }}>{item.active ? "Deactivate" : "Activate"}</button></article>)}</div>
    </section>
  );
}

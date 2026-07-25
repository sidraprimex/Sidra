"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { archiveProduct, duplicateProduct, listStudioProducts } from "@/services/productManagementService";
import type { StudioProduct } from "@/types/phase4-product";
import { ProductCard } from "@/components/product-management/ProductCard";

export function ProductListManager({ studioId }: { readonly studioId: string }): React.JSX.Element {
  const [products, setProducts] = useState<readonly StudioProduct[]>([]);
  const [status, setStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setProducts(await listStudioProducts(studioId)); setError(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Products could not be loaded."); }
  }, [studioId]);
  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => status === "all" ? products : products.filter((item) => item.status === status), [products, status]);

  return (
    <section className="grid gap-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Studio Catalog</p><h1 className="mt-2 font-heading text-4xl">Products</h1></div>
        <Link href="/studio-admin/products/new" className="rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-center text-white">Create product</Link>
      </header>
      <select className="w-full rounded-[var(--radius-md)] border border-border bg-card px-4 py-3 sm:max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="all">All statuses</option><option value="draft">Draft</option><option value="pendingReview">Pending review</option><option value="published">Published</option><option value="archived">Archived</option>
      </select>
      {error ? <p className="rounded-[var(--radius-md)] border border-[var(--color-error)] p-4 text-sm text-[var(--color-error)]">{error}</p> : null}
      {visible.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">No products in this view.</div> : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{visible.map((product) => <div key={product.id} className="grid gap-3"><ProductCard product={product} /><div className="flex gap-2"><Link href={`/studio-admin/products/${product.id}/edit`} className="rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm">Edit</Link><button className="rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm" onClick={async () => { await duplicateProduct(product.id); await load(); }}>Duplicate</button><button className="rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm" onClick={async () => { await archiveProduct(product.id); await load(); }}>Archive</button></div></div>)}</div>
      )}
    </section>
  );
}

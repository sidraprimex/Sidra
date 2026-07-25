"use client";

import { useEffect, useState } from "react";
import { approveProduct, listPendingProducts, suspendProduct } from "@/services/productApprovalService";
import type { StudioProduct } from "@/types/phase4-product";
import { ProductCard } from "@/components/product-management/ProductCard";

export function ProductModerationQueue({ reviewerId }: { readonly reviewerId: string }): React.JSX.Element {
  const [products, setProducts] = useState<readonly StudioProduct[]>([]);
  const load = async () => setProducts(await listPendingProducts());
  useEffect(() => { void load(); }, []);
  return (
    <section className="grid gap-7">
      <header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Controlled Review</p><h1 className="mt-2 font-heading text-4xl">Product moderation</h1></header>
      {products.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">No products are waiting for review.</div> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => <div key={product.id} className="grid gap-3"><ProductCard product={product} /><div className="flex gap-2"><button className="rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-4 py-2 text-white" onClick={async () => { await approveProduct(product.id, reviewerId); await load(); }}>Approve</button><button className="rounded-[var(--radius-md)] border border-border px-4 py-2" onClick={async () => { const reason = window.prompt("Moderation reason"); if (reason) { await suspendProduct(product.id, reviewerId, reason); await load(); } }}>Suspend</button></div></div>)}</div>}
    </section>
  );
}

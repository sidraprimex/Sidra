"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { PublicProduct } from "@/types/phase5-discovery";
import { ProductGrid } from "@/components/discovery/ProductGrid";
import { listRelatedProducts } from "@/services/publicDiscoveryService";
import { recordRecentlyViewed } from "@/services/recentlyViewedService";

export function ProductDetailClient({ product }: { readonly product: PublicProduct }): React.JSX.Element {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? "");
  const [related, setRelated] = useState<readonly PublicProduct[]>([]);
  const image = product.heroImageUrl ?? product.media.find((item) => item.kind === "image")?.url ?? null;
  const price = (product.salePricePaise ?? product.pricePaise) / 100;
  const available = product.inventoryMode !== "finite" || (product.inventoryCount ?? 0) > 0;

  useEffect(() => {
    void recordRecentlyViewed(product.id);
    void listRelatedProducts(product).then(setRelated);
  }, [product]);


  return <div className="grid gap-16">
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <div className="grid gap-4"><div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] bg-card">{image ? <Image src={image} alt={product.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 60vw" /> : null}</div>{product.media.length > 1 ? <div className="grid grid-cols-4 gap-3">{product.media.slice(0,4).map((media) => <div key={media.id} className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-card">{media.kind === "image" ? <Image src={media.url} alt={media.alt || product.name} fill className="object-cover" sizes="160px" /> : null}</div>)}</div> : null}</div>
      <div className="lg:sticky lg:top-24 lg:self-start"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">{product.categorySlug}</p><h1 className="mt-3 font-heading text-[clamp(3rem,7vw,5rem)] leading-[0.92]">{product.name}</h1><p className="mt-5 text-lg leading-8 text-muted">{product.shortDescription}</p><p className="mt-6 font-heading text-3xl">₹{price.toLocaleString("en-IN")}</p>{product.variants.length > 0 ? <label className="mt-7 grid gap-2 text-sm">Variant<select className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" value={selectedVariantId} onChange={(e) => setSelectedVariantId(e.target.value)}>{product.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.type}: {variant.value}</option>)}</select></label> : null}<label className="mt-4 grid gap-2 text-sm">Quantity<input type="number" min="1" max={product.inventoryMode === "finite" ? product.inventoryCount ?? 1 : 20} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className="w-28 rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" /></label><div className="mt-6 grid gap-3 sm:grid-cols-2"><button disabled={!available} className="rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50">Add to cart</button><button disabled={!available} className="rounded-[var(--radius-md)] border border-border px-5 py-3 disabled:opacity-50">Buy now</button></div><div className="mt-8 border-t border-border pt-7"><h2 className="font-heading text-2xl">The story</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-muted">{product.story || product.description}</p></div></div>
    </section>
    <section><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Rule-based discovery</p><h2 className="mt-3 font-heading text-4xl">Related pieces</h2><div className="mt-7"><ProductGrid products={related} /></div></section>
  </div>;
}

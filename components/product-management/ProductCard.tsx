"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { StudioProduct } from "@/types/phase4-product";
import { ProductStatusBadge } from "@/components/product-management/ProductStatusBadge";
import { WishlistHeartButton } from "@/components/customer/WishlistHeartButton";

const frameClass: Record<string, string> = {
  trays: "aspect-[16/10]", "serving-boards": "aspect-[16/10]", clocks: "aspect-square rounded-full", coasters: "aspect-square rounded-full", bookmarks: "aspect-[3/5]", keychains: "aspect-square rounded-[var(--radius-lg)]", jewellery: "aspect-square rounded-[var(--radius-lg)]", "wall-art": "aspect-[4/5]", frames: "aspect-[4/5]",
};

export function ProductCard({ product }: { readonly product: StudioProduct }): React.JSX.Element {
  const image = product.heroImageUrl ?? product.media.find((item) => item.kind === "image")?.url ?? null;
  const shape = frameClass[product.categorySlug] ?? "aspect-[4/5]";
  const href = product.status === "published" ? `/product/${encodeURIComponent(product.slug)}` : `/studio-admin/products/${product.id}/edit`;
  const publicCard = product.status === "published";
  return <motion.article whileHover={{y:-8}} transition={{type:"spring",stiffness:220,damping:22}} className="group relative overflow-hidden rounded-[2rem] border border-[rgba(59,30,53,.12)] bg-[linear-gradient(145deg,rgba(248,244,240,.96),rgba(213,189,159,.18))] shadow-[0_24px_70px_rgba(59,30,53,.12)]">
    {publicCard ? <WishlistHeartButton productId={product.id} productSlug={product.slug} productName={product.name} imageUrl={image} studioId={product.studioId} studioName={(product as StudioProduct & {studioName?: string}).studioName ?? "Sidra Studio"} pricePaise={product.salePricePaise ?? product.pricePaise} /> : null}
    <Link href={href} aria-label={`Open ${product.name}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-champagne)]">
      <div className={`relative overflow-hidden bg-[var(--color-porcelain)] ${shape}`}>
        {image ? <Image src={image} alt={product.name} fill className="object-cover transition duration-700 group-hover:scale-[1.055]" sizes="(max-width: 768px) 100vw, 33vw" /> : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(59,30,53,.30))] opacity-70" />
        <motion.div className="absolute -bottom-12 left-1/2 h-24 w-[75%] -translate-x-1/2 rounded-[50%] bg-[rgba(213,189,159,.32)] blur-2xl" animate={{scale:[1,1.18,1],opacity:[.35,.7,.35]}} transition={{duration:4,repeat:Infinity}} />
      </div>
      <div className="grid gap-3 p-5">
        <div className="flex items-start justify-between gap-4"><h3 className="font-heading text-2xl text-[var(--color-deep-plum)]">{product.name}</h3><ProductStatusBadge status={product.status} /></div>
        <p className="line-clamp-2 text-sm leading-6 text-[rgba(28,28,28,.64)]">{product.shortDescription}</p>
        <div className="flex items-center justify-between gap-4 border-t border-[rgba(59,30,53,.09)] pt-4"><p className="font-semibold text-[var(--color-deep-onyx)]">₹{((product.salePricePaise ?? product.pricePaise) / 100).toLocaleString("en-IN")}</p><span className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--color-deep-plum)]">View piece →</span></div>
      </div>
    </Link>
  </motion.article>;
}

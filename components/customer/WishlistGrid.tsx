"use client";

import { useState } from "react";
import Link from "next/link";
import { toggleWishlistProduct } from "@/services/customerEngagementService";
import { formatInr } from "@/utils/cartTotals";
import type { WishlistItem } from "@/types/phase9-customer";

export function WishlistGrid({ initialItems }: { readonly initialItems: readonly WishlistItem[] }): React.JSX.Element {
  const [items, setItems] = useState(initialItems);

  const remove = async (item: WishlistItem) => {
    const result = await toggleWishlistProduct({
      productId: item.productId,
      productSlug: item.productSlug,
      productName: item.productName,
      imageUrl: item.imageUrl,
      studioId: item.studioId,
      studioName: item.studioName,
      pricePaise: item.pricePaise,
    });
    if (!result.active) setItems((current) => current.filter((entry) => entry.productId !== item.productId));
  };

  if (items.length === 0) {
    return <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">Your wishlist is empty.</div>;
  }

  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {items.map((item) => <article key={item.wishlistItemId} className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{item.studioName}</p>
      <h2 className="mt-3 font-heading text-2xl">{item.productName}</h2>
      <p className="mt-3">{formatInr(item.pricePaise)}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/product/${item.productSlug}`} className="rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-4 py-2 text-white">View product</Link>
        <button onClick={() => void remove(item)} className="rounded-[var(--radius-md)] border border-border px-4 py-2">Remove</button>
      </div>
    </article>)}
  </div>;
}

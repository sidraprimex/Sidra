"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { addCartItem } from "@/services/cartSyncService";
import type { PublicProduct } from "@/types/phase5-discovery";
import { ProductGrid } from "@/components/discovery/ProductGrid";
import { listRelatedProducts } from "@/services/publicDiscoveryService";
import { recordRecentlyViewed } from "@/services/recentlyViewedService";

export function ProductDetailClient({ product }: { readonly product: PublicProduct }): React.JSX.Element {
  const initialImage = product.heroImageUrl ?? product.media.find((item) => item.kind === "image")?.url ?? null;
  const [activeImage, setActiveImage] = useState<string | null>(initialImage);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? "");
  const [related, setRelated] = useState<readonly PublicProduct[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const auth = useAuth();
  const router = useRouter();
  const price = (product.salePricePaise ?? product.pricePaise) / 100;
  const available = product.inventoryMode !== "finite" || (product.inventoryCount ?? 0) > 0;

  useEffect(() => {
    void recordRecentlyViewed(product.id);
    void listRelatedProducts(product).then(setRelated);
  }, [product]);


  const addToCart = async (checkout: boolean) => {
    if (!available || busy) return;

    if (!auth.user) {
      router.push(
        "/login?redirect=" +
          encodeURIComponent("/product/" + product.slug),
      );
      return;
    }

    const selectedVariant = product.variants.find(
      (variant) => variant.id === selectedVariantId,
    );
    const preparationDays = Math.max(
      1,
      Number(product.productionTimeDays ?? 1),
    );
    const deliveryDays =
      preparationDays +
      Math.max(1, Number(product.shippingTimeDays ?? 1));

    setBusy(true);
    setMessage(null);

    try {
      await addCartItem(auth.user.uid, {
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        imageUrl: activeImage,
        studioId: product.studioId,
        studioName: product.studioName ?? "Sidra Studio",
        variantId: selectedVariantId || null,
        variantLabel: selectedVariant
          ? selectedVariant.type + ": " + selectedVariant.value
          : null,
        unitPricePaise:
          product.salePricePaise ?? product.pricePaise,
        quantity,
        estimatedDeliveryStart: new Date(
          Date.now() + preparationDays * 86400000,
        ).toISOString().slice(0, 10),
        estimatedDeliveryEnd: new Date(
          Date.now() + deliveryDays * 86400000,
        ).toISOString().slice(0, 10),
      });

      if (checkout) {
        router.push("/checkout");
      } else {
        setMessage("Product added to your cart.");
      }
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Product could not be added to cart.",
      );
    } finally {
      setBusy(false);
    }
  };

  return <div className="grid gap-16">
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <div className="grid gap-4"><div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] bg-card">{activeImage ? <Image src={activeImage} alt={product.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 60vw" /> : null}</div>{product.media.length > 1 ? <div className="grid grid-cols-4 gap-3">{product.media.slice(0,4).map((media) => <button type="button" key={media.id} onClick={() => media.kind === "image" && setActiveImage(media.url)} className={"relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-card " + (activeImage === media.url ? "ring-2 ring-[var(--color-gold-600)]" : "")}>{media.kind === "image" ? <Image src={media.url} alt={media.alt || product.name} fill className="object-cover" sizes="160px" /> : null}</button>)}</div> : null}</div>
      <div className="lg:sticky lg:top-24 lg:self-start"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">{product.categorySlug}</p><h1 className="mt-3 font-heading text-[clamp(3rem,7vw,5rem)] leading-[0.92]">{product.name}</h1><p className="mt-5 text-lg leading-8 text-muted">{product.shortDescription}</p><p className="mt-6 font-heading text-3xl">₹{price.toLocaleString("en-IN")}</p>{product.variants.length > 0 ? <label className="mt-7 grid gap-2 text-sm">Variant<select className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" value={selectedVariantId} onChange={(e) => setSelectedVariantId(e.target.value)}>{product.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.type}: {variant.value}</option>)}</select></label> : null}<label className="mt-4 grid gap-2 text-sm">Quantity<input type="number" min="1" max={product.inventoryMode === "finite" ? product.inventoryCount ?? 1 : 20} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className="w-28 rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" /></label><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" disabled={!available || busy} onClick={() => void addToCart(false)} className="rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50">{busy ? "Adding…" : "Add to cart"}</button><button type="button" disabled={!available || busy} onClick={() => void addToCart(true)} className="rounded-[var(--radius-md)] border border-border px-5 py-3 disabled:opacity-50">Buy now</button></div>{message ? <p className="mt-4 rounded-[var(--radius-md)] border border-border bg-card p-4 text-sm">{message}</p> : null}{product.studioSlug ? <Link href={"/studio/" + product.studioSlug} className="mt-5 inline-flex text-sm font-semibold underline">Sold by {product.studioName ?? "Sidra Studio"}</Link> : null}<div className="mt-8 border-t border-border pt-7"><h2 className="font-heading text-2xl">Product details</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-muted">{product.description}</p>{product.story ? <><h2 className="mt-7 font-heading text-2xl">The craft story</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-muted">{product.story}</p></> : null}{product.materials.length > 0 ? <p className="mt-6 text-sm"><strong>Materials:</strong> {product.materials.join(", ")}</p> : null}<p className="mt-3 text-sm"><strong>Production time:</strong> {product.productionTimeDays} days</p></div></div>
    </section>
    <section><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Rule-based discovery</p><h2 className="mt-3 font-heading text-4xl">Related pieces</h2><div className="mt-7"><ProductGrid products={related} /></div></section>
  </div>;
}

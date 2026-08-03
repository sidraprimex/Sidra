import Image from "next/image";
import Link from "next/link";
import type { StudioProduct } from "@/types/phase4-product";
import { ProductStatusBadge } from "@/components/product-management/ProductStatusBadge";

const frameClass: Record<string, string> = {
  trays: "aspect-[16/10]",
  "serving-boards": "aspect-[16/10]",
  clocks: "aspect-square rounded-full",
  coasters: "aspect-square rounded-full",
  bookmarks: "aspect-[3/5]",
  keychains: "aspect-square rounded-[var(--radius-lg)]",
  jewellery: "aspect-square rounded-[var(--radius-lg)]",
  "wall-art": "aspect-[4/5]",
  frames: "aspect-[4/5]",
};

export function ProductCard({ product }: { readonly product: StudioProduct }): React.JSX.Element {
  const image = product.heroImageUrl ?? product.media.find((item) => item.kind === "image")?.url ?? null;
  const shape = frameClass[product.categorySlug] ?? "aspect-[4/5]";
  const href =
    product.status === "published"
      ? "/product/" + encodeURIComponent(product.slug)
      : "/studio-admin/products/" + product.id + "/edit";

  return (
    <Link
      href={href}
      aria-label={"Open " + product.name}
      className="group block rounded-[var(--radius-lg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold-600)]"
    >
      <article className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-card)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
      <div className={`relative overflow-hidden bg-background ${shape}`}>
        {image ? <Image src={image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" /> : null}
      </div>
      <div className="grid gap-3 p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-heading text-xl text-foreground">{product.name}</h3>
          <ProductStatusBadge status={product.status} />
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-muted">{product.shortDescription}</p>
        <div className="flex items-center justify-between gap-4"><p className="text-sm font-semibold text-foreground">₹{(product.salePricePaise ?? product.pricePaise) / 100}</p><span className="text-xs font-semibold text-[var(--color-gold-600)]">View details →</span></div>
      </div>
      </article>
    </Link>
  );
}

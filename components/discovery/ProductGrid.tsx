import { ProductCard } from "@/components/product-management/ProductCard";
import type { PublicProduct } from "@/types/phase5-discovery";

export function ProductGrid({ products }: { readonly products: readonly PublicProduct[] }): React.JSX.Element {
  if (products.length === 0) {
    return <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">No published pieces match this view.</div>;
  }
  return <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}

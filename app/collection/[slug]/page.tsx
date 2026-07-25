import { ProductGrid } from "@/components/discovery/ProductGrid";
import { listPublishedProducts } from "@/services/publicDiscoveryService";

export const revalidate = 60;

export default async function CollectionPage({ params }: { readonly params: Promise<{ slug: string }> }): Promise<React.JSX.Element> {
  const { slug } = await params;
  const products = await listPublishedProducts({ collectionId: slug, pageSize: 60 });
  return <main className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 sm:px-8"><header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Collection</p><h1 className="mt-3 font-heading text-[clamp(3rem,8vw,6rem)] capitalize">{slug.replace(/-/g," ")}</h1></header><ProductGrid products={products} /></main>;
}

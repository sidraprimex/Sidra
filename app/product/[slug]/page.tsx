import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/product-detail/ProductDetailClient";
import { getPublicProductBySlug } from "@/services/publicDiscoveryService";

export const revalidate = 60;

export default async function ProductPage({ params }: { readonly params: Promise<{ slug: string }> }): Promise<React.JSX.Element> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) notFound();
  return <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8"><ProductDetailClient product={product} /></main>;
}

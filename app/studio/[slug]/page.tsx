import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/discovery/ProductGrid";
import { getPublicStudioBySlug, listPublishedProducts } from "@/services/publicDiscoveryService";

export const revalidate = 60;

export default async function PublicStudioPage({ params }: { readonly params: Promise<{ slug: string }> }): Promise<React.JSX.Element> {
  const { slug } = await params;
  const studio = await getPublicStudioBySlug(slug);
  if (!studio) notFound();
  const products = await listPublishedProducts({ studioId: studio.id, pageSize: 60 });
  return <main className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-12 sm:px-8"><header className="rounded-[var(--radius-lg)] border border-border bg-card p-8 sm:p-12"><div className="flex flex-wrap items-center gap-3"><span className="rounded-full border border-border px-3 py-1 text-xs">{studio.verified ? "Verified Studio" : "Studio"}</span>{studio.featured ? <span className="rounded-full border border-border px-3 py-1 text-xs text-[var(--color-gold-600)]">Featured</span> : null}</div><h1 className="mt-6 font-heading text-[clamp(3.2rem,8vw,7rem)] leading-[0.9]">{studio.name}</h1><p className="mt-6 max-w-3xl whitespace-pre-wrap text-lg leading-8 text-muted">{studio.story}</p><div className="mt-7 flex flex-wrap gap-5 text-sm text-muted"><span>{studio.location}</span><span>{studio.rating.toFixed(1)} rating</span><span>{studio.followerCount} followers</span></div></header><section><h2 className="font-heading text-4xl">The collection</h2><div className="mt-7"><ProductGrid products={products} /></div></section></main>;
}

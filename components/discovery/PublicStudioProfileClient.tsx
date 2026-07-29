"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/discovery/ProductGrid";
import {
  getPublicStudioBySlug,
  listPublishedProducts,
} from "@/services/publicDiscoveryService";
import type {
  PublicProduct,
  PublicStudio,
} from "@/types/phase5-discovery";

export function PublicStudioProfileClient({
  slug,
}: {
  readonly slug: string;
}): React.JSX.Element {
  const [studio, setStudio] = useState<PublicStudio | null>(null);
  const [products, setProducts] = useState<
    readonly PublicProduct[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getPublicStudioBySlug(slug)
      .then(async (nextStudio) => {
        if (!nextStudio) {
          throw new Error("This Studio is not available.");
        }
        const nextProducts = await listPublishedProducts({
          studioId: nextStudio.id,
          pageSize: 60,
        });
        if (!active) return;
        setStudio(nextStudio);
        setProducts(nextProducts);
        setError(null);
      })
      .catch((caught) => {
        if (!active) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Studio could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 sm:px-8">
        <div className="h-80 animate-pulse rounded-[var(--radius-lg)] bg-card" />
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="aspect-[4/3] animate-pulse rounded-[var(--radius-lg)] bg-card"
            />
          ))}
        </div>
      </main>
    );
  }

  if (error || !studio) {
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-24 text-center sm:px-8">
        <section className="rounded-[var(--radius-lg)] border border-border bg-card p-10">
          <h1 className="font-heading text-4xl">
            Studio unavailable
          </h1>
          <p className="mt-4 text-muted">
            {error ?? "This Studio is not available."}
          </p>
          <Link
            href="/studios"
            className="mt-6 inline-flex rounded-[var(--radius-md)] border border-border px-5 py-3"
          >
            Return to Studio Directory
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-12 sm:px-8">
      <header className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card">
        <div className="relative min-h-52 bg-[linear-gradient(135deg,#31162d,#d8b7a7)] sm:min-h-72">
          {studio.bannerUrl ? (
            <Image
              src={studio.bannerUrl}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
        </div>
        <div className="relative p-8 pt-16 sm:p-12 sm:pt-20">
          <div className="absolute -top-12 left-8 flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-[var(--color-deep-plum)] text-3xl text-white sm:left-12">
            {studio.logoUrl ? (
              <Image
                src={studio.logoUrl}
                alt={`${studio.name} logo`}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              studio.name.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-border px-3 py-1 text-xs">
              {studio.verified ? "Verified Studio" : "Studio"}
            </span>
            {studio.featured ? (
              <span className="rounded-full border border-border px-3 py-1 text-xs text-[var(--color-gold-600)]">
                Featured
              </span>
            ) : null}
          </div>
          <h1 className="mt-6 font-heading text-[clamp(3.2rem,8vw,7rem)] leading-[0.9]">
            {studio.name}
          </h1>
          <p className="mt-6 max-w-3xl whitespace-pre-wrap text-lg leading-8 text-muted">
            {studio.story ||
              "An independent Sidra Studio creating handcrafted resin pieces."}
          </p>
          <div className="mt-7 flex flex-wrap gap-5 text-sm text-muted">
            <span>{studio.location || "India"}</span>
            <span>{studio.rating.toFixed(1)} rating</span>
            <span>{studio.followerCount} followers</span>
            <span>
              {products.length} piece
              {products.length === 1 ? "" : "s"}
            </span>
          </div>
          {studio.contactEnabled ? (
            <Link
              href={`/custom-order/${studio.id}`}
              className="mt-7 inline-flex rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white"
            >
              Start custom order
            </Link>
          ) : null}
        </div>
      </header>
      <section>
        <h2 className="font-heading text-4xl">The collection</h2>
        <div className="mt-7">
          <ProductGrid products={products} />
        </div>
      </section>
    </main>
  );
}

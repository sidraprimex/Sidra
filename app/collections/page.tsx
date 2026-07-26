"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listActiveCollections } from "@/services/collectionService";
import type { Collection } from "@/types/catalog";

export default function CollectionsPage(): React.JSX.Element {
  const [collections, setCollections] = useState<readonly Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void listActiveCollections()
      .then((items) => {
        if (!mounted) return;
        setCollections(items);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!mounted) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "Collections could not be loaded.",
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-ivory-100 px-5 pb-24 pt-24 text-black-900 sm:px-8">
      <section className="mx-auto w-full max-w-7xl">
        <header className="max-w-4xl">
          <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-600">
            Curated resin artistry
          </p>

          <h1 className="mt-4 font-display text-[clamp(3.5rem,9vw,7.5rem)] leading-[0.85] tracking-[-0.04em]">
            Collections
          </h1>

          <p className="mt-7 max-w-2xl text-body-lg text-gray-700">
            Discover limited resin objects and collectible work selected from
            verified Sidra Studios.
          </p>
        </header>

        {loading ? (
          <div
            aria-label="Loading collections"
            className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-lg border border-gray-100 bg-ivory-50 shadow-card"
              />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <section className="mt-14 rounded-lg border border-error/30 bg-ivory-50 p-8">
            <p className="text-micro font-semibold uppercase tracking-[0.18em] text-error">
              Collections unavailable
            </p>

            <p className="mt-3 max-w-2xl text-caption text-gray-700">
              {error}
            </p>
          </section>
        ) : null}

        {!loading && !error && collections.length === 0 ? (
          <section className="mt-14 rounded-lg border border-gray-100 bg-ivory-50 p-10 shadow-card">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-600">
              Curating now
            </p>

            <h2 className="mt-3 font-display text-h1">
              New collections are being prepared.
            </h2>

            <p className="mt-4 max-w-xl text-caption text-gray-700">
              Collections published through the Founder CMS will appear here
              automatically.
            </p>

            <Link
              href="/studios"
              className="mt-7 inline-flex min-h-12 items-center rounded-lg bg-black-900 px-6 py-3 text-caption font-semibold text-ivory-100"
            >
              Explore Studios
            </Link>
          </section>
        ) : null}

        {!loading && !error && collections.length > 0 ? (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.collectionId}
                href={`/collection/${collection.slug}`}
                className="group relative flex min-h-80 overflow-hidden rounded-lg border border-gold-500/20 bg-black-950 p-7 text-ivory-100 shadow-card transition duration-slow ease-luxury hover:-translate-y-1 hover:shadow-modal"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-cover bg-center transition duration-cinematic ease-luxury group-hover:scale-105"
                  style={{
                    backgroundImage: collection.imageUrl
                      ? `linear-gradient(180deg, rgba(7,7,7,.18), rgba(7,7,7,.94)), url("${collection.imageUrl}")`
                      : "radial-gradient(circle at 20% 15%, rgba(200,169,106,.38), transparent 36%), linear-gradient(145deg, #191511, #070707)",
                  }}
                />

                <div className="relative z-10 flex w-full flex-col justify-between">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-micro uppercase tracking-[0.2em] text-gold-500">
                      Sidra Collection
                    </span>

                    {collection.featured ? (
                      <span className="rounded-full border border-gold-500/40 px-3 py-1 text-micro text-gold-100">
                        Featured
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h2 className="font-display text-[clamp(2.4rem,5vw,4rem)] leading-none">
                      {collection.name}
                    </h2>

                    {collection.description ? (
                      <p className="mt-4 line-clamp-3 max-w-sm text-caption text-gray-300">
                        {collection.description}
                      </p>
                    ) : null}

                    <span className="mt-6 inline-flex items-center gap-3 text-micro font-semibold uppercase tracking-[0.16em] text-gold-500">
                      Enter collection
                      <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

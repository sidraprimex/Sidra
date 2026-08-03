"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listMarketplaceCollections,
  type MarketplaceCollectionCard,
} from "@/services/collectionService";

export default function CollectionsPage(): React.JSX.Element {
  const [collections, setCollections] = useState<
    readonly MarketplaceCollectionCard[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void listMarketplaceCollections()
      .then((items) => {
        if (!active) return;
        setCollections(items);
        setError(null);
      })
      .catch((caught) => {
        if (!active) return;
        setError(
          caught instanceof Error
            ? caught.message
            : "Collections could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-ivory-100 px-5 pb-24 pt-24 text-black-900 sm:px-8">
      <section className="mx-auto w-full max-w-7xl">
        <header className="max-w-4xl">
          <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-600">
            Sidra marketplace
          </p>

          <h1 className="mt-4 font-display text-[clamp(3.5rem,9vw,7.5rem)] leading-[0.85] tracking-[-0.04em]">
            Collections
          </h1>

          <p className="mt-7 max-w-2xl text-body-lg text-gray-700">
            Explore curated collections created by Sidra and
            verified independent Studios.
          </p>
        </header>

        {loading ? (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-lg border border-gray-100 bg-ivory-50"
              />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <section className="mt-14 rounded-lg border border-error/30 bg-ivory-50 p-8">
            <h2 className="font-display text-3xl">
              Collections unavailable
            </h2>
            <p className="mt-3 text-gray-700">{error}</p>
          </section>
        ) : null}

        {!loading && !error && collections.length === 0 ? (
          <section className="mt-14 rounded-lg border border-gray-100 bg-ivory-50 p-10 shadow-card">
            <h2 className="font-display text-h1">
              No live collections yet
            </h2>
            <p className="mt-4 text-gray-700">
              A collection will appear here as soon as a verified
              Studio creates it and assigns published products.
            </p>
            <Link
              href="/studios"
              className="mt-7 inline-flex rounded-lg bg-black-900 px-6 py-3 font-semibold text-ivory-100"
            >
              Explore Studios
            </Link>
          </section>
        ) : null}

        {!loading && !error && collections.length > 0 ? (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={collection.href}
                className="group relative flex min-h-80 overflow-hidden rounded-lg border border-gold-500/20 bg-black-950 p-7 text-ivory-100 shadow-card transition hover:-translate-y-1 hover:shadow-modal"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: collection.imageUrl
                      ? `linear-gradient(180deg,rgba(7,7,7,.15),rgba(7,7,7,.94)),url("${collection.imageUrl}")`
                      : "radial-gradient(circle at 20% 15%,rgba(200,169,106,.38),transparent 36%),linear-gradient(145deg,#3b1e35,#070707)",
                  }}
                />

                <div className="relative z-10 flex w-full flex-col justify-between">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-micro uppercase tracking-[0.2em] text-gold-500">
                      {collection.source === "studio"
                        ? "Studio Collection"
                        : "Sidra Collection"}
                    </span>

                    {collection.featured ? (
                      <span className="rounded-full border border-gold-500/40 px-3 py-1 text-micro">
                        Featured
                      </span>
                    ) : null}
                  </div>

                  <div>
                    {collection.studioName ? (
                      <p className="mb-3 text-micro uppercase tracking-[0.16em] text-gray-300">
                        By {collection.studioName}
                      </p>
                    ) : null}

                    <h2 className="font-display text-[clamp(2.4rem,5vw,4rem)] leading-none">
                      {collection.name}
                    </h2>

                    {collection.description ? (
                      <p className="mt-4 line-clamp-3 text-caption text-gray-300">
                        {collection.description}
                      </p>
                    ) : null}

                    <span className="mt-6 inline-flex text-micro font-semibold uppercase tracking-[0.16em] text-gold-500">
                      Explore collection →
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

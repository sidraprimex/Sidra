"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listPublicStudios } from "@/services/publicDiscoveryService";
import type { PublicStudio } from "@/types/phase5-discovery";

function safeBackgroundImage(url: string): string {
  const safeUrl = url.replace(/["\\\n\r]/g, "");
  return `url("${safeUrl}")`;
}

export default function CustomOrdersPage(): React.JSX.Element {
  const [studios, setStudios] = useState<readonly PublicStudio[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void listPublicStudios({
      sort: "featured",
    })
      .then((items) => {
        if (!mounted) return;

        setStudios(
          items.filter(
            (studio) =>
              studio.active &&
              studio.status !== "suspended" &&
              studio.contactEnabled,
          ),
        );
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!mounted) return;

        setError(
          reason instanceof Error
            ? reason.message
            : "Custom-order Studios could not be loaded.",
        );
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const visibleStudios = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return studios;
    }

    return studios.filter((studio) => {
      const searchableContent = [
        studio.name,
        studio.location,
        studio.story,
        ...studio.categories,
      ]
        .join(" ")
        .toLowerCase();

      return searchableContent.includes(query);
    });
  }, [searchTerm, studios]);

  return (
    <main className="min-h-screen overflow-hidden bg-black-950 pb-24 pt-24 text-ivory-100">
      <section className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-gold-500/10 blur-3xl"
        />

        <header className="relative grid gap-10 border-b border-gold-500/20 pb-14 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="max-w-5xl">
            <p className="text-micro font-semibold uppercase tracking-[0.28em] text-gold-500">
              Created exclusively for you
            </p>

            <h1 className="mt-5 font-display text-[clamp(4rem,11vw,9rem)] leading-[0.78] tracking-[-0.045em]">
              Custom
              <span className="block text-gold-100">Orders</span>
            </h1>

            <p className="mt-8 max-w-3xl text-body-lg leading-8 text-gray-300">
              Commission a personalised resin piece directly from a verified
              Sidra Studio. Share your idea, review the Studio quote and approve
              the final proof before production begins.
            </p>
          </div>

          <div className="rounded-lg border border-gold-500/20 bg-charcoal-800/80 p-6 shadow-modal backdrop-blur">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
              Protected process
            </p>

            <ol className="mt-5 space-y-5">
              {[
                "Choose a verified Studio",
                "Submit your complete brief",
                "Review and accept the quote",
                "Approve the final design proof",
              ].map((step, index) => (
                <li
                  key={step}
                  className="flex items-start gap-4 text-caption leading-6 text-gray-300"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gold-500/40 text-micro font-semibold text-gold-100">
                    {index + 1}
                  </span>

                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </header>

        <section className="relative pt-12">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
                Select your artist
              </p>

              <h2 className="mt-3 font-display text-[clamp(2.8rem,6vw,5.5rem)] leading-none">
                Commission a Studio
              </h2>
            </div>

            <label className="w-full max-w-md">
              <span className="sr-only">
                Search Studios by name, category or location
              </span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                }}
                placeholder="Search Studio, craft or location"
                className="min-h-12 w-full rounded-lg border border-gold-500/25 bg-charcoal-800 px-5 py-3 text-caption text-ivory-100 outline-none transition duration-base placeholder:text-gray-500 focus:border-gold-500"
              />
            </label>
          </div>

          {loading ? (
            <div
              aria-label="Loading custom-order Studios"
              className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="h-[30rem] animate-pulse rounded-lg border border-gold-500/10 bg-charcoal-800"
                />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <section className="mt-10 rounded-lg border border-error/40 bg-charcoal-800 p-8">
              <p className="text-micro font-semibold uppercase tracking-[0.18em] text-error">
                Studios unavailable
              </p>

              <p className="mt-4 max-w-2xl text-caption leading-6 text-gray-300">
                {error}
              </p>
            </section>
          ) : null}

          {!loading && !error && visibleStudios.length === 0 ? (
            <section className="mt-10 rounded-lg border border-gold-500/20 bg-charcoal-800 p-10 shadow-modal">
              <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
                No matching Studio
              </p>

              <h3 className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] leading-none">
                Try another artist, craft or location.
              </h3>

              <p className="mt-5 max-w-xl text-caption leading-7 text-gray-300">
                Only active verified Studios accepting customer enquiries
                appear in this selection.
              </p>

              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                  }}
                  className="mt-7 min-h-12 rounded-lg border border-gold-500/50 px-6 py-3 text-caption font-semibold text-gold-100 transition duration-base hover:bg-gold-500 hover:text-black-950"
                >
                  Clear Search
                </button>
              ) : (
                <Link
                  href="/studios"
                  className="mt-7 inline-flex min-h-12 items-center rounded-lg border border-gold-500/50 px-6 py-3 text-caption font-semibold text-gold-100 transition duration-base hover:bg-gold-500 hover:text-black-950"
                >
                  Explore All Studios
                </Link>
              )}
            </section>
          ) : null}

          {!loading && !error && visibleStudios.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleStudios.map((studio) => (
                <article
                  key={studio.id}
                  className="group relative flex min-h-[30rem] overflow-hidden rounded-lg border border-gold-500/20 bg-charcoal-800 shadow-card transition duration-slow ease-luxury hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-gold-glow"
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center transition duration-cinematic ease-luxury group-hover:scale-105"
                    style={{
                      backgroundImage: studio.bannerUrl
                        ? `linear-gradient(180deg, rgba(7,7,7,.12), rgba(7,7,7,.96)), ${safeBackgroundImage(studio.bannerUrl)}`
                        : "radial-gradient(circle at 75% 15%, rgba(200,169,106,.32), transparent 34%), linear-gradient(145deg, #211c16, #0b0b0b)",
                    }}
                  />

                  <div className="relative z-10 flex w-full flex-col justify-between p-7">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                        {studio.verified
                          ? "Verified Studio"
                          : "Sidra Studio"}
                      </span>

                      <span className="rounded-full border border-gold-500/30 px-3 py-1 text-micro text-gold-100">
                        {studio.rating.toFixed(1)} rating
                      </span>
                    </div>

                    <div>
                      <p className="text-micro uppercase tracking-[0.15em] text-gray-300">
                        {studio.location || "India"}
                      </p>

                      <h3 className="mt-3 font-display text-[clamp(2.8rem,5vw,4.5rem)] leading-[0.92]">
                        {studio.name}
                      </h3>

                      <p className="mt-5 line-clamp-3 text-caption leading-6 text-gray-300">
                        {studio.story}
                      </p>

                      {studio.categories.length > 0 ? (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {studio.categories.slice(0, 3).map((category) => (
                            <span
                              key={category}
                              className="rounded-full border border-ivory-100/15 px-3 py-1 text-micro text-gray-300"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-7 grid gap-3 sm:grid-cols-2">
                        <Link
                          href={`/custom-order/${studio.id}`}
                          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gold-500 px-5 py-3 text-center text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
                        >
                          Start Custom Order
                        </Link>

                        <Link
                          href={`/studio/${studio.slug}`}
                          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gold-500/40 px-5 py-3 text-center text-caption font-semibold text-gold-100 transition duration-base hover:border-gold-500 hover:bg-gold-500/10"
                        >
                          View Studio
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

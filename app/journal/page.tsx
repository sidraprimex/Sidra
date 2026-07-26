"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listPublishedJournal } from "@/services/journalService";
import type { DateTimeValue } from "@/types/firestore";
import type { JournalArticle } from "@/types/marketing";

function resolveDate(value: DateTimeValue): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  const date = new Date(value.seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatPublishedDate(value: DateTimeValue): string {
  const date = resolveDate(value);

  if (!date) {
    return "Recently published";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function JournalPage(): React.JSX.Element {
  const [articles, setArticles] = useState<readonly JournalArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void listPublishedJournal(24)
      .then((items) => {
        if (!mounted) return;

        setArticles(items);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!mounted) return;

        setError(
          reason instanceof Error
            ? reason.message
            : "The Sidra Journal could not be loaded.",
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

  return (
    <main className="min-h-screen overflow-hidden bg-black-950 px-5 pb-24 pt-24 text-ivory-100 sm:px-8">
      <section className="relative mx-auto w-full max-w-7xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
        />

        <header className="relative max-w-4xl border-b border-gold-500/20 pb-10">
          <p className="text-micro font-semibold uppercase tracking-[0.28em] text-gold-500">
            Stories of material and makers
          </p>

          <h1 className="mt-5 font-display text-[clamp(4rem,11vw,9rem)] leading-[0.78] tracking-[-0.045em]">
            Sidra
            <span className="block text-gold-100">Journal</span>
          </h1>

          <p className="mt-8 max-w-2xl text-body-lg text-gray-300">
            Enter the studios, processes and personal stories behind
            extraordinary resin craft.
          </p>
        </header>

        {loading ? (
          <div
            aria-label="Loading journal stories"
            className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="h-[28rem] animate-pulse rounded-lg border border-gold-500/10 bg-charcoal-800"
              />
            ))}
          </div>
        ) : null}

        {!loading && error ? (
          <section className="mt-12 rounded-lg border border-error/40 bg-charcoal-800 p-8">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-error">
              Journal unavailable
            </p>

            <p className="mt-4 max-w-2xl text-caption text-gray-300">
              {error}
            </p>
          </section>
        ) : null}

        {!loading && !error && articles.length === 0 ? (
          <section className="mt-12 overflow-hidden rounded-lg border border-gold-500/20 bg-charcoal-800 p-10 shadow-modal">
            <p className="text-micro font-semibold uppercase tracking-[0.22em] text-gold-500">
              Stories in preparation
            </p>

            <h2 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,6vw,5rem)] leading-none">
              The first pages of the Sidra Journal are being composed.
            </h2>

            <p className="mt-6 max-w-xl text-caption text-gray-300">
              Articles published through the Founder CMS will automatically
              appear in this gallery.
            </p>

            <Link
              href="/studios"
              className="mt-8 inline-flex min-h-12 items-center rounded-lg border border-gold-500/50 px-6 py-3 text-caption font-semibold text-gold-100 transition duration-base hover:bg-gold-500 hover:text-black-950"
            >
              Discover Studios
            </Link>
          </section>
        ) : null}

        {!loading && !error && articles.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
              <Link
                key={article.articleId || article.slug}
                href={`/journal/${article.slug}`}
                className={`group relative flex overflow-hidden rounded-lg border border-gold-500/20 bg-charcoal-800 shadow-card transition duration-slow ease-luxury hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-gold-glow ${
                  index === 0
                    ? "min-h-[36rem] md:col-span-2 lg:col-span-2"
                    : "min-h-[28rem]"
                }`}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-cover bg-center transition duration-cinematic ease-luxury group-hover:scale-105"
                  style={{
                    backgroundImage: article.coverImageUrl
                      ? `linear-gradient(180deg, rgba(11,11,11,.08), rgba(11,11,11,.96)), url("${article.coverImageUrl}")`
                      : "radial-gradient(circle at 70% 15%, rgba(200,169,106,.32), transparent 34%), linear-gradient(145deg, #24201a, #0b0b0b)",
                  }}
                />

                <div className="relative z-10 flex w-full flex-col justify-between p-7 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
                      {article.category || "Sidra Journal"}
                    </span>

                    <time className="text-micro text-gray-300">
                      {formatPublishedDate(article.publishedAt)}
                    </time>
                  </div>

                  <div className="max-w-2xl">
                    <h2
                      className={`font-display leading-[0.95] ${
                        index === 0
                          ? "text-[clamp(3rem,7vw,6rem)]"
                          : "text-[clamp(2.3rem,4vw,3.8rem)]"
                      }`}
                    >
                      {article.title}
                    </h2>

                    <p className="mt-5 line-clamp-3 max-w-xl text-caption text-gray-300">
                      {article.excerpt}
                    </p>

                    <span className="mt-7 inline-flex items-center gap-3 text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                      Read the story
                      <span
                        aria-hidden="true"
                        className="transition duration-base group-hover:translate-x-2"
                      >
                        →
                      </span>
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

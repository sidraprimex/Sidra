import Link from "next/link";
import { notFound } from "next/navigation";
import { JournalArticleBody } from "@/components/journal/JournalArticleBody";
import { getPublishedJournalBySlug } from "@/services/journalService";
import type { DateTimeValue } from "@/types/firestore";

export const revalidate = 60;

interface JournalArticlePageProps {
  readonly params: Promise<{
    readonly slug: string;
  }>;
}

function resolveDate(value: DateTimeValue): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  const parsed = new Date(value.seconds * 1000);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

function safeBackgroundImage(url: string): string {
  const safeUrl = url.replace(/["\\\n\r]/g, "");

  return [
    "linear-gradient(180deg, rgba(7,7,7,.08), rgba(7,7,7,.32) 45%, rgba(7,7,7,.98))",
    `url("${safeUrl}")`,
  ].join(", ");
}

export default async function JournalArticlePage({
  params,
}: JournalArticlePageProps): Promise<React.JSX.Element> {
  const { slug } = await params;
  const article = await getPublishedJournalBySlug(slug);

  if (!article) {
    notFound();
  }

  const bodyBlocks = Array.isArray(article.body)
    ? article.body
    : [];

  return (
    <main className="min-h-screen bg-black-950 text-ivory-100">
      <article>
        <header className="relative flex min-h-[78vh] overflow-hidden border-b border-gold-500/20">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: article.coverImageUrl
                ? safeBackgroundImage(article.coverImageUrl)
                : "radial-gradient(circle at 72% 14%, rgba(200,169,106,.32), transparent 32%), linear-gradient(145deg, #211c16, #070707 72%)",
            }}
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(239,227,203,0.08),transparent_32%)]"
          />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-between px-5 pb-12 pt-28 sm:px-8 sm:pb-16">
            <Link
              href="/journal"
              className="inline-flex w-fit items-center gap-3 text-micro font-semibold uppercase tracking-[0.18em] text-gold-100 transition duration-base hover:text-gold-500"
            >
              <span aria-hidden="true">←</span>
              Sidra Journal
            </Link>

            <div className="max-w-5xl">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <span className="text-micro font-semibold uppercase tracking-[0.22em] text-gold-500">
                  {article.category || "Sidra Journal"}
                </span>

                <span
                  aria-hidden="true"
                  className="h-1 w-1 rounded-full bg-gold-500"
                />

                <time className="text-micro uppercase tracking-[0.14em] text-gray-300">
                  {formatPublishedDate(article.publishedAt)}
                </time>
              </div>

              <h1 className="mt-6 font-display text-[clamp(3.8rem,10vw,8.8rem)] leading-[0.82] tracking-[-0.045em]">
                {article.title}
              </h1>

              <p className="mt-8 max-w-3xl text-body-lg leading-8 text-gray-200">
                {article.excerpt}
              </p>
            </div>
          </div>
        </header>

        <section className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:py-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-12 h-80 w-80 rounded-full bg-gold-500/5 blur-3xl"
          />

          <div className="relative mx-auto w-full max-w-3xl">
            <JournalArticleBody
              blocks={bodyBlocks}
              fallbackText={article.excerpt}
            />
          </div>

          <aside className="relative border-t border-gold-500/20 pt-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
              Story details
            </p>

            <dl className="mt-6 space-y-6">
              <div>
                <dt className="text-micro uppercase tracking-[0.14em] text-gray-500">
                  Published
                </dt>
                <dd className="mt-2 text-caption text-gray-200">
                  {formatPublishedDate(article.publishedAt)}
                </dd>
              </div>

              <div>
                <dt className="text-micro uppercase tracking-[0.14em] text-gray-500">
                  Category
                </dt>
                <dd className="mt-2 text-caption text-gray-200">
                  {article.category || "Editorial"}
                </dd>
              </div>
            </dl>

            {article.tags.length > 0 ? (
              <div className="mt-8 border-t border-gold-500/20 pt-7">
                <p className="text-micro uppercase tracking-[0.14em] text-gray-500">
                  Filed under
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-gold-500/30 px-3 py-1.5 text-micro text-gold-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <Link
              href="/studios"
              className="mt-10 inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-gold-500/50 px-5 py-3 text-center text-caption font-semibold text-gold-100 transition duration-base hover:bg-gold-500 hover:text-black-950"
            >
              Explore Sidra Studios
            </Link>
          </aside>
        </section>
      </article>
    </main>
  );
}

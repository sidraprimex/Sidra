import Link from "next/link";
import { NewsletterSignupForm } from "@/components/homepage/NewsletterSignupForm";
import { SidraHeroExperience } from "@/components/homepage/SidraHeroExperience";
import { LuxuryMediaWall } from "@/components/homepage/LuxuryMediaWall";
import type { DateTimeValue } from "@/types/firestore";
import type { JournalArticle } from "@/types/marketing";
import type { ProductReview } from "@/types/phase9-customer";
import type {
  Category,
  Collection,
} from "@/types/catalog";
import type {
  HomepageBlock,
  PublicProduct,
  PublicStudio,
} from "@/types/phase5-discovery";

function text(
  data: Readonly<Record<string, unknown>>,
  key: string,
  fallback = "",
): string {
  return typeof data[key] === "string"
    ? String(data[key])
    : fallback;
}

function strings(
  data: Readonly<Record<string, unknown>>,
  key: string,
): readonly string[] {
  return Array.isArray(data[key])
    ? (data[key] as unknown[]).filter(
        (item): item is string => typeof item === "string",
      )
    : [];
}

function positiveInteger(
  data: Readonly<Record<string, unknown>>,
  key: string,
  fallback: number,
): number {
  const value = data[key];

  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  ) {
    return value;
  }

  return fallback;
}

function safeBackgroundImage(url: string): string {
  const safeUrl = url.replace(/["\\\n\r]/g, "");

  return [
    "linear-gradient(180deg, rgba(7,7,7,.08), rgba(7,7,7,.35) 42%, rgba(7,7,7,.97))",
    `url("${safeUrl}")`,
  ].join(", ");
}

function resolveJournalDate(
  value: DateTimeValue,
): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime())
      ? null
      : parsed;
  }

  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  const parsed = new Date(value.seconds * 1000);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}

function journalTimestamp(value: DateTimeValue): number {
  return resolveJournalDate(value)?.getTime() ?? 0;
}

function formatJournalDate(value: DateTimeValue): string {
  const date = resolveJournalDate(value);

  if (!date) {
    return "Recently published";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}


function formatPrice(pricePaise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(pricePaise / 100);
}

function productEngagementScore(product: PublicProduct): number {
  return (
    (product.salesCount ?? 0) * 100 +
    (product.wishlistCount ?? 0) * 12 +
    (product.reviewCount ?? 0) * 4 +
    (product.rating ?? 0) * 10 +
    (product.featured ? 25 : 0)
  );
}


export function HeroBlock({
  block,
}: {
  readonly block: HomepageBlock;
}): React.JSX.Element {
  return (
    <>
      <SidraHeroExperience
        eyebrow={text(
          block.data,
          "eyebrow",
          "Curated resin artistry",
        )}
        headline={text(
          block.data,
          "headline",
          "Objects made slowly. Kept for years.",
        )}
        subhead={text(
          block.data,
          "subhead",
          "Discover verified independent Studios creating handcrafted resin pieces across India.",
        )}
        primaryCtaLabel={text(
          block.data,
          "primaryCtaLabel",
          "Explore Studios",
        )}
        primaryCtaHref={text(
          block.data,
          "primaryCtaHref",
          "/studios",
        )}
        secondaryCtaLabel={text(
          block.data,
          "secondaryCtaLabel",
          "Browse Collections",
        )}
        secondaryCtaHref={text(
          block.data,
          "secondaryCtaHref",
          "/collections",
        )}
        videoUrl={text(block.data, "videoUrl", "")}
        images={strings(block.data, "heroImages")}
      />
      <LuxuryMediaWall images={strings(block.data, "wallImages")} />
    </>
  );
}

export function FeaturedStudiosBlock({
  block,
  studios,
}: {
  readonly block: HomepageBlock;
  readonly studios: readonly PublicStudio[];
}): React.JSX.Element {
  const limit = positiveInteger(block.data, "limit", 6);

  const visibleStudios = studios
    .filter(
      (studio) =>
        studio.active &&
        studio.status !== "suspended",
    )
    .slice(0, limit);

  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden border-t border-gold-500/15 bg-[color:rgba(59,30,53,0.32)] px-5 py-20 text-ivory-100 backdrop-blur-[2px] sm:px-8 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-gold-500/5 blur-3xl"
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl">
        <header className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-4xl">
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              Curated artist boutiques
            </p>

            <h2 className="mt-5 font-display text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.88]">
              {text(
                block.data,
                "title",
                "Featured Studios",
              )}
            </h2>

            <p className="mt-6 max-w-2xl text-body-lg leading-8 text-gray-300">
              Enter the private digital worlds of verified resin
              artists selected for their craft, originality and
              presentation.
            </p>
          </div>

          <Link
            href="/studios"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg border border-gold-500/45 px-6 py-3 text-caption font-semibold text-gold-100 transition duration-base hover:bg-gold-500 hover:text-black-950"
          >
            View All Studios
          </Link>
        </header>

        {visibleStudios.length === 0 ? (
          <section className="mt-12 rounded-lg border border-gold-500/20 bg-black-950 p-8 shadow-modal sm:p-10">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
              Studio curation
            </p>

            <h3 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,6vw,5rem)] leading-none text-gold-100">
              The next verified Sidra Studios are being prepared.
            </h3>

            <p className="mt-6 max-w-2xl text-caption leading-7 text-gray-300">
              Once a seller is approved and their Studio is published
              through Firebase, it will automatically appear here.
            </p>

            <Link
              href="/sell-on-sidra"
              className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-6 py-3 text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
            >
              Apply for a Sidra Studio
            </Link>
          </section>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleStudios.map((studio, index) => (
              <Link
                key={studio.id}
                href={`/studio/${studio.slug}`}
                className={`group relative flex overflow-hidden rounded-lg border border-gold-500/20 bg-black-950 shadow-card transition duration-slow ease-luxury hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-gold-glow ${
                  index === 0
                    ? "min-h-[36rem] md:col-span-2 lg:col-span-2"
                    : "min-h-[30rem]"
                }`}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-cover bg-center transition duration-cinematic ease-luxury group-hover:scale-105"
                  style={{
                    backgroundImage: studio.bannerUrl
                      ? safeBackgroundImage(studio.bannerUrl)
                      : "radial-gradient(circle at 70% 12%, rgba(213,189,159,.34), transparent 34%), linear-gradient(145deg, #3B1E35, #1C1C1C)",
                  }}
                />

                <div className="relative z-10 flex w-full flex-col justify-between p-7 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
                      {studio.verified
                        ? "Verified Studio"
                        : "Sidra Studio"}
                    </span>

                    <span className="rounded-full border border-gold-500/35 bg-black-950/40 px-3 py-1 text-micro text-gold-100 backdrop-blur">
                      {studio.rating.toFixed(1)} ·{" "}
                      {studio.reviewCount} reviews
                    </span>
                  </div>

                  <div className="max-w-2xl">
                    <p className="text-micro uppercase tracking-[0.16em] text-gray-300">
                      {studio.location || "India"}
                    </p>

                    <h3
                      className={`mt-3 font-display leading-[0.9] text-gold-100 ${
                        index === 0
                          ? "text-[clamp(3.2rem,7vw,6rem)]"
                          : "text-[clamp(2.6rem,5vw,4.5rem)]"
                      }`}
                    >
                      {studio.name}
                    </h3>

                    <p className="mt-5 line-clamp-3 max-w-xl text-caption leading-7 text-gray-300">
                      {studio.story}
                    </p>

                    {studio.categories.length > 0 ? (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {studio.categories
                          .slice(0, 3)
                          .map((category) => (
                            <span
                              key={category}
                              className="rounded-full border border-ivory-100/15 px-3 py-1 text-micro text-gray-300"
                            >
                              {category}
                            </span>
                          ))}
                      </div>
                    ) : null}

                    <div className="mt-7 flex flex-wrap items-center gap-5 text-micro uppercase tracking-[0.14em] text-gray-300">
                      <span>
                        {studio.productCount} pieces
                      </span>

                      <span>
                        {studio.followerCount} followers
                      </span>
                    </div>

                    <span className="mt-7 inline-flex items-center gap-3 text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                      Enter Studio
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
        )}
      </div>
    </section>
  );
}

export function FeaturedCollectionsBlock({
  block,
  collections,
}: {
  readonly block: HomepageBlock;
  readonly collections: readonly Collection[];
}): React.JSX.Element {
  const limit = positiveInteger(block.data, "limit", 6);

  const orderedCollections = [...collections].sort(
    (first, second) => {
      if (first.featured !== second.featured) {
        return first.featured ? -1 : 1;
      }

      return first.sortOrder - second.sortOrder;
    },
  );

  const visibleCollections = orderedCollections
    .filter((collection) => collection.active)
    .slice(0, limit);

  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden border-t border-gold-500/15 bg-[color:rgba(28,28,28,0.36)] px-5 py-20 text-ivory-100 backdrop-blur-[2px] sm:px-8 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-0 h-[34rem] w-[34rem] rounded-full bg-gold-500/10 blur-3xl"
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl">
        <header className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-4xl">
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              Objects brought together with intention
            </p>

            <h2 className="mt-5 font-display text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.88]">
              {text(
                block.data,
                "title",
                "Curated Collections",
              )}
            </h2>

            <p className="mt-6 max-w-2xl text-body-lg leading-8 text-gray-300">
              Explore limited resin pieces arranged by mood, material,
              technique and the stories they were created to preserve.
            </p>
          </div>

          <Link
            href="/collections"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg border border-gold-500/45 px-6 py-3 text-caption font-semibold text-gold-100 transition duration-base hover:bg-gold-500 hover:text-black-950"
          >
            Browse All Collections
          </Link>
        </header>

        {visibleCollections.length === 0 ? (
          <section className="mt-12 rounded-lg border border-gold-500/20 bg-charcoal-800 p-8 shadow-modal sm:p-10">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
              Collection curation
            </p>

            <h3 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,6vw,5rem)] leading-none text-gold-100">
              Sidra&apos;s first live collections are being assembled.
            </h3>

            <p className="mt-6 max-w-2xl text-caption leading-7 text-gray-300">
              Active collections published from the Founder CMS will
              automatically appear here without changing the website code.
            </p>

            <Link
              href="/studios"
              className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-6 py-3 text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
            >
              Explore Studios
            </Link>
          </section>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-12">
            {visibleCollections.map((collection, index) => {
              const largeCard = index === 0 || index === 3;

              return (
                <Link
                  key={collection.collectionId}
                  href={`/collection/${collection.slug}`}
                  className={`group relative flex min-h-[30rem] overflow-hidden rounded-lg border border-gold-500/20 bg-charcoal-800 shadow-card transition duration-slow ease-luxury hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-gold-glow ${
                    largeCard
                      ? "lg:col-span-7"
                      : "lg:col-span-5"
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center transition duration-cinematic ease-luxury group-hover:scale-105"
                    style={{
                      backgroundImage: collection.imageUrl
                        ? safeBackgroundImage(
                            collection.imageUrl,
                          )
                        : "radial-gradient(circle at 74% 14%, rgba(213,189,159,.34), transparent 34%), linear-gradient(145deg, #261f17, #080808)",
                    }}
                  />

                  <div className="relative z-10 flex w-full flex-col justify-between p-7 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <span className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
                        Sidra Collection
                      </span>

                      {collection.featured ? (
                        <span className="rounded-full border border-gold-500/40 bg-black-950/40 px-3 py-1 text-micro text-gold-100 backdrop-blur">
                          Featured
                        </span>
                      ) : null}
                    </div>

                    <div className="max-w-2xl">
                      <p className="text-micro uppercase tracking-[0.15em] text-gray-300">
                        {collection.productIds.length} curated pieces
                      </p>

                      <h3
                        className={`mt-3 font-display leading-[0.9] text-gold-100 ${
                          largeCard
                            ? "text-[clamp(3.1rem,7vw,6rem)]"
                            : "text-[clamp(2.7rem,5vw,4.6rem)]"
                        }`}
                      >
                        {collection.name}
                      </h3>

                      {collection.description ? (
                        <p className="mt-5 line-clamp-3 max-w-xl text-caption leading-7 text-gray-300">
                          {collection.description}
                        </p>
                      ) : null}

                      <span className="mt-7 inline-flex items-center gap-3 text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                        Enter Collection

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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function SignatureCategoriesBlock({
  block,
  categories,
}: {
  readonly block: HomepageBlock;
  readonly categories: readonly Category[];
}): React.JSX.Element {
  const limit = positiveInteger(block.data, "limit", 8);

  const visibleCategories = [...categories]
    .filter((category) => category.active)
    .sort((first, second) => {
      if (first.featured !== second.featured) {
        return first.featured ? -1 : 1;
      }

      return first.sortOrder - second.sortOrder;
    })
    .slice(0, limit);

  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden border-t border-gold-500/15 bg-[color:rgba(59,30,53,0.32)] px-5 py-20 text-ivory-100 backdrop-blur-[2px] sm:px-8 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 bottom-0 h-[34rem] w-[34rem] rounded-full bg-gold-500/5 blur-3xl"
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl">
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              Discover resin by form and purpose
            </p>

            <h2 className="mt-5 font-display text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.88]">
              {text(
                block.data,
                "title",
                "Signature Categories",
              )}
            </h2>
          </div>

          <p className="max-w-xl text-body-lg leading-8 text-gray-300">
            Move through keepsakes, décor, jewellery, gifting and
            personalised resin work curated from verified Sidra Studios.
          </p>
        </header>

        {visibleCategories.length === 0 ? (
          <section className="mt-12 rounded-lg border border-gold-500/20 bg-black-950 p-8 shadow-modal sm:p-10">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
              Category curation
            </p>

            <h3 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,6vw,5rem)] leading-none text-gold-100">
              Sidra&apos;s signature categories are being composed.
            </h3>

            <p className="mt-6 max-w-2xl text-caption leading-7 text-gray-300">
              Active categories published through the Founder CMS will
              automatically appear in this gallery.
            </p>

            <Link
              href="/studios"
              className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-6 py-3 text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
            >
              Explore Studios
            </Link>
          </section>
        ) : (
          <div className="mt-12 grid auto-rows-[18rem] gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visibleCategories.map((category, index) => {
              const featureCard =
                index === 0 || index === 5;

              return (
                <Link
                  key={category.categoryId}
                  href={`/category/${category.slug}`}
                  className={`group relative flex overflow-hidden rounded-lg border border-gold-500/20 bg-black-950 shadow-card transition duration-slow ease-luxury hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-gold-glow ${
                    featureCard
                      ? "sm:row-span-2 lg:col-span-2"
                      : ""
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center transition duration-cinematic ease-luxury group-hover:scale-105"
                    style={{
                      backgroundImage: category.imageUrl
                        ? safeBackgroundImage(
                            category.imageUrl,
                          )
                        : "radial-gradient(circle at 72% 14%, rgba(213,189,159,.34), transparent 34%), linear-gradient(145deg, #251f18, #1C1C1C)",
                    }}
                  />

                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black-950 via-black-950/20 to-transparent"
                  />

                  <div className="relative z-10 flex w-full flex-col justify-between p-6 sm:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                        Resin Category
                      </span>

                      {category.featured ? (
                        <span className="rounded-full border border-gold-500/35 bg-black-950/40 px-3 py-1 text-micro text-gold-100 backdrop-blur">
                          Signature
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h3
                        className={`font-display leading-[0.92] text-gold-100 ${
                          featureCard
                            ? "text-[clamp(3rem,7vw,6rem)]"
                            : "text-[clamp(2.3rem,4vw,3.8rem)]"
                        }`}
                      >
                        {category.name}
                      </h3>

                      {category.description ? (
                        <p className="mt-4 line-clamp-3 max-w-xl text-caption leading-7 text-gray-300">
                          {category.description}
                        </p>
                      ) : null}

                      <span className="mt-6 inline-flex items-center gap-3 text-micro font-semibold uppercase tracking-[0.17em] text-gold-500">
                        Explore Category

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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function BestSellersBlock({
  block,
  products,
}: {
  readonly block: HomepageBlock;
  readonly products: readonly PublicProduct[];
}): React.JSX.Element {
  const limit = positiveInteger(block.data, "limit", 8);

  const visibleProducts = [...products]
    .filter((product) => product.status === "published")
    .sort((first, second) => {
      const scoreDifference =
        productEngagementScore(second) -
        productEngagementScore(first);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return journalTimestamp(second.updatedAt) - journalTimestamp(first.updatedAt);
    })
    .slice(0, limit);

  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden border-t border-gold-500/15 bg-[color:rgba(28,28,28,0.36)] px-5 py-20 text-ivory-100 backdrop-blur-[2px] sm:px-8 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-[34rem] w-[34rem] rounded-full bg-gold-500/10 blur-3xl"
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl">
        <header className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-4xl">
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              Pieces customers return to
            </p>

            <h2 className="mt-5 font-display text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.88]">
              {text(
                block.data,
                "title",
                "Most Collected",
              )}
            </h2>

            <p className="mt-6 max-w-2xl text-body-lg leading-8 text-gray-300">
              Discover published resin pieces gaining attention across
              Sidra through real customer interest, reviews and orders.
            </p>
          </div>

          <Link
            href="/search?sort=featured"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg border border-gold-500/45 px-6 py-3 text-caption font-semibold text-gold-100 transition duration-base hover:bg-gold-500 hover:text-black-950"
          >
            Explore All Pieces
          </Link>
        </header>

        {visibleProducts.length === 0 ? (
          <section className="mt-12 rounded-lg border border-gold-500/20 bg-charcoal-800 p-8 shadow-modal sm:p-10">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
              Collection activity
            </p>

            <h3 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,6vw,5rem)] leading-none text-gold-100">
              Published pieces will appear here as Sidra grows.
            </h3>

            <p className="mt-6 max-w-2xl text-caption leading-7 text-gray-300">
              Products approved and published by verified Studios will
              automatically enter this live gallery.
            </p>

            <Link
              href="/studios"
              className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-6 py-3 text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
            >
              Explore Studios
            </Link>
          </section>
        ) : (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visibleProducts.map((product, index) => {
              const activePrice =
                product.salePricePaise ?? product.pricePaise;

              const hasSale =
                product.salePricePaise !== null &&
                product.salePricePaise < product.pricePaise;

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className={`group relative flex min-h-[32rem] overflow-hidden rounded-lg border border-gold-500/20 bg-charcoal-800 shadow-card transition duration-slow ease-luxury hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-gold-glow ${
                    index === 0
                      ? "sm:col-span-2 lg:row-span-2 lg:min-h-[42rem]"
                      : ""
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center transition duration-cinematic ease-luxury group-hover:scale-105"
                    style={{
                      backgroundImage: product.heroImageUrl
                        ? safeBackgroundImage(
                            product.heroImageUrl,
                          )
                        : "radial-gradient(circle at 72% 14%, rgba(213,189,159,.34), transparent 34%), linear-gradient(145deg, #261f17, #080808)",
                    }}
                  />

                  <div className="relative z-10 flex w-full flex-col justify-between p-6 sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                        {index === 0
                          ? "Most Collected"
                          : "Sidra Piece"}
                      </span>

                      {hasSale ? (
                        <span className="rounded-full border border-gold-500/40 bg-black-950/50 px-3 py-1 text-micro text-gold-100 backdrop-blur">
                          Special Price
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-micro uppercase tracking-[0.15em] text-gray-300">
                        {product.studioName ||
                          "Verified Sidra Studio"}
                      </p>

                      <h3
                        className={`mt-3 font-display leading-[0.92] text-gold-100 ${
                          index === 0
                            ? "text-[clamp(3.2rem,7vw,6rem)]"
                            : "text-[clamp(2.3rem,4vw,3.8rem)]"
                        }`}
                      >
                        {product.name}
                      </h3>

                      <p className="mt-4 line-clamp-3 text-caption leading-7 text-gray-300">
                        {product.shortDescription}
                      </p>

                      <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-2">
                        <span className="break-words font-display text-h2 text-gold-100">
                          {formatPrice(activePrice)}
                        </span>

                        {hasSale ? (
                          <span className="pb-1 text-caption text-gray-500 line-through">
                            {formatPrice(product.pricePaise)}
                          </span>
                        ) : null}
                      </div>

                      {(product.rating ?? 0) > 0 ? (
                        <p className="mt-4 text-micro uppercase tracking-[0.14em] text-gray-300">
                          {(product.rating ?? 0).toFixed(1)} rating
                          {" · "}
                          {product.reviewCount ?? 0} reviews
                        </p>
                      ) : null}

                      <span className="mt-7 inline-flex items-center gap-3 text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                        View Piece

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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function NewArrivalsBlock({
  block,
  products,
}: {
  readonly block: HomepageBlock;
  readonly products: readonly PublicProduct[];
}): React.JSX.Element {
  const limit = positiveInteger(block.data, "limit", 8);

  const visibleProducts = [...products]
    .filter((product) => product.status === "published")
    .sort((first, second) =>
      journalTimestamp(second.updatedAt) - journalTimestamp(first.updatedAt),
    )
    .slice(0, limit);

  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden border-t border-gold-500/15 bg-[color:rgba(59,30,53,0.32)] px-5 py-20 text-ivory-100 backdrop-blur-[2px] sm:px-8 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-20 h-[34rem] w-[34rem] rounded-full bg-gold-500/5 blur-3xl"
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl">
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              Recently entered the Sidra gallery
            </p>

            <h2 className="mt-5 font-display text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.88]">
              {text(
                block.data,
                "title",
                "New Arrivals",
              )}
            </h2>
          </div>

          <div>
            <p className="text-body-lg leading-8 text-gray-300">
              Newly published resin work from verified Studios,
              presented as soon as it enters the Sidra collection.
            </p>

            <Link
              href="/search?sort=newest"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg border border-gold-500/45 px-6 py-3 text-caption font-semibold text-gold-100 transition duration-base hover:bg-gold-500 hover:text-black-950"
            >
              View Latest Pieces
            </Link>
          </div>
        </header>

        {visibleProducts.length === 0 ? (
          <section className="mt-12 rounded-lg border border-gold-500/20 bg-black-950 p-8 shadow-modal sm:p-10">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
              Awaiting new work
            </p>

            <h3 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,6vw,5rem)] leading-none text-gold-100">
              New resin pieces will appear here after Studio approval.
            </h3>

            <p className="mt-6 max-w-2xl text-caption leading-7 text-gray-300">
              Published products are loaded directly from Firebase.
              Only verified, published Sidra products appear here.
            </p>

            <Link
              href="/studios"
              className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-6 py-3 text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
            >
              Explore Studios
            </Link>
          </section>
        ) : (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visibleProducts.map((product, index) => {
              const activePrice =
                product.salePricePaise ?? product.pricePaise;

              const hasSale =
                product.salePricePaise !== null &&
                product.salePricePaise < product.pricePaise;

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  className={`group relative flex min-h-[31rem] overflow-hidden rounded-lg border border-gold-500/20 bg-black-950 shadow-card transition duration-slow ease-luxury hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-gold-glow ${
                    index === 0
                      ? "sm:col-span-2 lg:col-span-2"
                      : ""
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center transition duration-cinematic ease-luxury group-hover:scale-105"
                    style={{
                      backgroundImage: product.heroImageUrl
                        ? safeBackgroundImage(
                            product.heroImageUrl,
                          )
                        : "radial-gradient(circle at 70% 12%, rgba(213,189,159,.34), transparent 34%), linear-gradient(145deg, #251f18, #1C1C1C)",
                    }}
                  />

                  <div className="relative z-10 flex w-full flex-col justify-between p-6 sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                        New Arrival
                      </span>

                      {hasSale ? (
                        <span className="rounded-full border border-gold-500/40 bg-black-950/50 px-3 py-1 text-micro text-gold-100 backdrop-blur">
                          Special Price
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-micro uppercase tracking-[0.15em] text-gray-300">
                        {product.studioName ||
                          "Verified Sidra Studio"}
                      </p>

                      <h3
                        className={`mt-3 font-display leading-[0.92] text-gold-100 ${
                          index === 0
                            ? "text-[clamp(3rem,7vw,5.8rem)]"
                            : "text-[clamp(2.3rem,4vw,3.8rem)]"
                        }`}
                      >
                        {product.name}
                      </h3>

                      <p className="mt-4 line-clamp-3 text-caption leading-7 text-gray-300">
                        {product.shortDescription}
                      </p>

                      <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-2">
                        <span className="break-words font-display text-h2 text-gold-100">
                          {formatPrice(activePrice)}
                        </span>

                        {hasSale ? (
                          <span className="pb-1 text-caption text-gray-500 line-through">
                            {formatPrice(product.pricePaise)}
                          </span>
                        ) : null}
                      </div>

                      {(product.rating ?? 0) > 0 ? (
                        <p className="mt-4 text-micro uppercase tracking-[0.14em] text-gray-300">
                          {(product.rating ?? 0).toFixed(1)} rating
                          {" · "}
                          {product.reviewCount ?? 0} reviews
                        </p>
                      ) : null}

                      <span className="mt-7 inline-flex items-center gap-3 text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                        View New Piece

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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function CustomOrderBannerBlock({
  block,
}: {
  readonly block: HomepageBlock;
}): React.JSX.Element {
  const configuredHref = text(
    block.data,
    "ctaHref",
    "/custom-orders",
  );

  const ctaHref = configuredHref.startsWith("/")
    ? configuredHref
    : "/custom-orders";

  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden border-t border-gold-500/15 bg-[color:rgba(28,28,28,0.36)] px-5 py-20 text-ivory-100 backdrop-blur-[2px] sm:px-8 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 28%, rgba(213,189,159,.18), transparent 26%), radial-gradient(circle at 82% 74%, rgba(122,82,45,.18), transparent 30%), linear-gradient(135deg, #070707 0%, #17120d 48%, #080808 100%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full border border-gold-500/15 bg-gold-500/5 blur-2xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full border border-gold-500/10 bg-gold-500/5 blur-3xl"
      />

      <div className="relative mx-auto grid w-full min-w-0 max-w-7xl overflow-hidden rounded-lg border border-gold-500/25 bg-charcoal-800/70 shadow-modal backdrop-blur md:grid-cols-[minmax(0,1.15fr)_minmax(20rem,.85fr)]">
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
            Personalised resin commissions
          </p>

          <h2 className="mt-6 max-w-4xl font-display text-[clamp(3.4rem,8vw,7.2rem)] leading-[0.86] text-gold-100">
            {text(
              block.data,
              "title",
              "Made around your story",
            )}
          </h2>

          <p className="mt-7 max-w-2xl text-body-lg leading-8 text-gray-300">
            {text(
              block.data,
              "body",
              "Commission a personalised piece from a verified Studio.",
            )}
          </p>

          <div className="mt-10">
            <Link
              href={ctaHref}
              className="group inline-flex min-h-14 items-center justify-center gap-4 rounded-lg bg-gold-500 px-8 py-4 text-caption font-semibold text-black-950 shadow-gold-glow transition duration-slow ease-luxury hover:-translate-y-1 hover:bg-gold-100"
            >
              {text(
                block.data,
                "ctaLabel",
                "Start a Custom Order",
              )}

              <span
                aria-hidden="true"
                className="transition duration-base group-hover:translate-x-2"
              >
                →
              </span>
            </Link>
          </div>
        </div>

        <div className="relative min-h-[30rem] overflow-hidden border-t border-gold-500/15 md:min-h-full md:border-l md:border-t-0">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 40%, rgba(244,220,172,.36), transparent 18%), radial-gradient(circle at 48% 48%, rgba(213,189,159,.24), transparent 34%), linear-gradient(145deg, #2c2116 0%, #0d0b09 58%, #050505 100%)",
            }}
          />

          <div
            aria-hidden="true"
            className="absolute left-[18%] top-[16%] h-52 w-52 rotate-12 rounded-[42%_58%_55%_45%/45%_42%_58%_55%] border border-gold-100/30 bg-gradient-to-br from-gold-100/25 via-gold-500/10 to-transparent shadow-gold-glow backdrop-blur-sm transition duration-cinematic ease-luxury hover:rotate-6 hover:scale-105 sm:h-64 sm:w-64"
          />

          <div
            aria-hidden="true"
            className="absolute bottom-[12%] right-[10%] h-44 w-44 -rotate-12 rounded-[58%_42%_38%_62%/48%_60%_40%_52%] border border-gold-500/25 bg-gradient-to-br from-amber-200/15 via-gold-500/10 to-black-950/30 shadow-card backdrop-blur sm:h-56 sm:w-56"
          />

          <div className="absolute inset-x-7 bottom-7 rounded-lg border border-gold-500/20 bg-black-950/65 p-6 backdrop-blur-md sm:inset-x-10 sm:bottom-10">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
              Your idea · A verified Studio · One unique piece
            </p>

            <p className="mt-3 text-caption leading-7 text-gray-300">
              Begin with your reference, occasion and preferences.
              Sidra connects the request to the custom-order journey.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhySidraBlock({
  block,
}: {
  readonly block: HomepageBlock;
}): React.JSX.Element {
  const configuredItems = Array.isArray(block.data.items)
    ? block.data.items.filter(
        (item): item is string =>
          typeof item === "string" &&
          item.trim().length > 0,
      )
    : [];

  const defaultItems = [
    "Verified Studios",
    "Transparent order tracking",
    "One trusted support line",
  ];

  const items =
    configuredItems.length > 0
      ? configuredItems.slice(0, 3)
      : defaultItems;

  const cardDetails = [
    {
      href: "/studios",
      eyebrow: "Studio trust",
      description:
        "Explore public Studio profiles connected to Sidra's seller application and approval system.",
    },
    {
      href: "/account/orders",
      eyebrow: "Order visibility",
      description:
        "Buyers can access their order journey, status updates and related account actions from one place.",
    },
    {
      href: "/support",
      eyebrow: "Connected support",
      description:
        "Order, account and custom-order support routes lead into Sidra's real support experience.",
    },
  ] as const;

  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden border-t border-gold-500/15 bg-[color:rgba(59,30,53,0.32)] px-5 py-20 text-ivory-100 backdrop-blur-[2px] sm:px-8 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 16% 16%, rgba(213,189,159,.12), transparent 26%), radial-gradient(circle at 88% 82%, rgba(122,82,45,.12), transparent 28%)",
        }}
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl">
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              The Sidra standard
            </p>

            <h2 className="mt-5 font-display text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.88] text-gold-100">
              {text(
                block.data,
                "title",
                "Craft, protected by trust",
              )}
            </h2>
          </div>

          <p className="text-body-lg leading-8 text-gray-300">
            A connected marketplace experience designed around
            responsible Studio access, visible buyer journeys and
            reachable platform support.
          </p>
        </header>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {items.map((item, index) => {
            const details =
              cardDetails[index] ?? cardDetails[2];

            return (
              <Link
                key={`${item}-${index}`}
                href={details.href}
                className="group relative min-h-[24rem] overflow-hidden rounded-lg border border-gold-500/20 bg-black-950 p-7 shadow-card transition duration-slow ease-luxury hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-gold-glow sm:p-8"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border border-gold-500/15 bg-gold-500/5 blur-xl transition duration-cinematic group-hover:scale-125"
                />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
                      {details.eyebrow}
                    </span>

                    <span className="break-words font-display text-h2 text-gold-500/50">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="mt-auto pt-20">
                    <h3 className="font-display text-[clamp(2.7rem,5vw,4.5rem)] leading-[0.9] text-gold-100">
                      {item}
                    </h3>

                    <p className="mt-5 text-caption leading-7 text-gray-300">
                      {details.description}
                    </p>

                    <span className="mt-7 inline-flex items-center gap-3 text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                      Learn More

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
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ArtistStoriesBlock({
  block,
  studios,
}: {
  readonly block: HomepageBlock;
  readonly studios: readonly PublicStudio[];
}): React.JSX.Element {
  const limit = positiveInteger(block.data, "limit", 3);

  const visibleStories = [...studios]
    .filter((studio) => {
      const story =
        typeof studio.story === "string"
          ? studio.story.trim()
          : "";

      return (
        studio.active &&
        studio.verified &&
        studio.slug.length > 0 &&
        story.length > 0
      );
    })
    .sort((first, second) => {
      if (first.featured !== second.featured) {
        return first.featured ? -1 : 1;
      }

      if (first.rating !== second.rating) {
        return second.rating - first.rating;
      }

      return second.followerCount - first.followerCount;
    })
    .slice(0, limit);

  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden border-t border-gold-500/15 bg-[color:rgba(28,28,28,0.36)] px-5 py-20 text-ivory-100 backdrop-blur-[2px] sm:px-8 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 h-[34rem] w-[34rem] rounded-full bg-gold-500/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-amber-900/10 blur-3xl"
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl">
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              Stories behind the objects
            </p>

            <h2 className="mt-5 font-display text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.88] text-gold-100">
              {text(
                block.data,
                "title",
                "Inside the Studio",
              )}
            </h2>
          </div>

          <div>
            <p className="text-body-lg leading-8 text-gray-300">
              Meet verified Sidra Studios through the real stories,
              materials and creative journeys published on their
              profiles.
            </p>

            <Link
              href="/studios"
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg border border-gold-500/45 px-6 py-3 text-caption font-semibold text-gold-100 transition duration-base hover:bg-gold-500 hover:text-black-950"
            >
              Discover All Studios
            </Link>
          </div>
        </header>

        {visibleStories.length === 0 ? (
          <section className="mt-12 rounded-lg border border-gold-500/20 bg-charcoal-800 p-8 shadow-modal sm:p-10">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
              Studio stories
            </p>

            <h3 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,6vw,5rem)] leading-none text-gold-100">
              The first verified Studio stories are being prepared.
            </h3>

            <p className="mt-6 max-w-2xl text-caption leading-7 text-gray-300">
              Once a verified Studio publishes its real story, it will
              automatically become eligible for this homepage section.
            </p>

            <Link
              href="/studios"
              className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-6 py-3 text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
            >
              Explore Studios
            </Link>
          </section>
        ) : (
          <div className="mt-12 grid gap-6 lg:grid-cols-12">
            {visibleStories.map((studio, index) => {
              const largeCard = index === 0;

              return (
                <Link
                  key={studio.id}
                  href={`/studio/${studio.slug}`}
                  className={`group relative flex min-h-[34rem] overflow-hidden rounded-lg border border-gold-500/20 bg-charcoal-800 shadow-card transition duration-slow ease-luxury hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-gold-glow ${
                    largeCard
                      ? "lg:col-span-6 lg:row-span-2 lg:min-h-[46rem]"
                      : "lg:col-span-6"
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center transition duration-cinematic ease-luxury group-hover:scale-105"
                    style={{
                      backgroundImage: studio.bannerUrl
                        ? safeBackgroundImage(studio.bannerUrl)
                        : "radial-gradient(circle at 70% 16%, rgba(213,189,159,.30), transparent 32%), linear-gradient(145deg, #281f16, #080808)",
                    }}
                  />

                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black-950 via-black-950/55 to-black-950/5"
                  />

                  <div className="relative z-10 flex w-full flex-col justify-between p-7 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <span className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
                        Verified Sidra Studio
                      </span>

                      {studio.featured ? (
                        <span className="rounded-full border border-gold-500/40 bg-black-950/50 px-3 py-1 text-micro text-gold-100 backdrop-blur">
                          Featured Story
                        </span>
                      ) : null}
                    </div>

                    <div className="max-w-2xl">
                      <p className="text-micro uppercase tracking-[0.16em] text-gray-300">
                        {studio.location || "Independent Resin Studio"}
                      </p>

                      <h3
                        className={`mt-3 font-display leading-[0.9] text-gold-100 ${
                          largeCard
                            ? "text-[clamp(3.4rem,7vw,6.4rem)]"
                            : "text-[clamp(2.8rem,5vw,4.8rem)]"
                        }`}
                      >
                        {studio.name}
                      </h3>

                      <p
                        className={`mt-6 text-caption leading-7 text-gray-200 ${
                          largeCard
                            ? "line-clamp-6"
                            : "line-clamp-4"
                        }`}
                      >
                        {studio.story}
                      </p>

                      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-micro uppercase tracking-[0.14em] text-gray-300">
                        {studio.rating > 0 ? (
                          <span>
                            {studio.rating.toFixed(1)} rating
                          </span>
                        ) : null}

                        {studio.productCount > 0 ? (
                          <span>
                            {studio.productCount} pieces
                          </span>
                        ) : null}

                        {studio.categories.length > 0 ? (
                          <span>
                            {studio.categories
                              .slice(0, 2)
                              .join(" · ")}
                          </span>
                        ) : null}
                      </div>

                      <span className="mt-7 inline-flex items-center gap-3 text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                        Enter the Studio

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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function JournalBlock({
  block,
  articles,
}: {
  readonly block: HomepageBlock;
  readonly articles: readonly JournalArticle[];
}): React.JSX.Element {
  const limit = positiveInteger(block.data, "limit", 3);

  const visibleArticles = [...articles]
    .filter(
      (article) =>
        article.status === "published" &&
        article.slug.trim().length > 0,
    )
    .sort(
      (first, second) =>
        journalTimestamp(second.publishedAt) -
        journalTimestamp(first.publishedAt),
    )
    .slice(0, limit);

  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden border-t border-gold-500/15 bg-[color:rgba(59,30,53,0.32)] px-5 py-20 text-ivory-100 backdrop-blur-[2px] sm:px-8 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-20 h-[34rem] w-[34rem] rounded-full bg-gold-500/10 blur-3xl"
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl">
        <header className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-4xl">
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              Material, process and makers
            </p>

            <h2 className="mt-5 font-display text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.88] text-gold-100">
              {text(
                block.data,
                "title",
                "The Journal",
              )}
            </h2>

            <p className="mt-6 max-w-2xl text-body-lg leading-8 text-gray-300">
              Enter the creative processes, personal journeys and
              thoughtful details behind extraordinary resin work.
            </p>
          </div>

          <Link
            href="/journal"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg border border-gold-500/45 px-6 py-3 text-caption font-semibold text-gold-100 transition duration-base hover:bg-gold-500 hover:text-black-950"
          >
            Read All Stories
          </Link>
        </header>

        {visibleArticles.length === 0 ? (
          <section className="mt-12 rounded-lg border border-gold-500/20 bg-black-950 p-8 shadow-modal sm:p-10">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
              Stories in preparation
            </p>

            <h3 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,6vw,5rem)] leading-none text-gold-100">
              The first pages of the Sidra Journal are being composed.
            </h3>

            <p className="mt-6 max-w-2xl text-caption leading-7 text-gray-300">
              Articles published through the Founder CMS will
              automatically appear here without changing website code.
            </p>

            <Link
              href="/studios"
              className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-6 py-3 text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
            >
              Discover Studios
            </Link>
          </section>
        ) : (
          <div className="mt-12 grid gap-6 lg:grid-cols-12">
            {visibleArticles.map((article, index) => {
              const featureArticle = index === 0;

              return (
                <Link
                  key={article.articleId || article.slug}
                  href={`/journal/${article.slug}`}
                  className={`group relative flex min-h-[32rem] overflow-hidden rounded-lg border border-gold-500/20 bg-black-950 shadow-card transition duration-slow ease-luxury hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-gold-glow ${
                    featureArticle
                      ? "lg:col-span-7 lg:min-h-[42rem]"
                      : "lg:col-span-5"
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center transition duration-cinematic ease-luxury group-hover:scale-105"
                    style={{
                      backgroundImage: article.coverImageUrl
                        ? safeBackgroundImage(
                            article.coverImageUrl,
                          )
                        : "radial-gradient(circle at 72% 14%, rgba(213,189,159,.32), transparent 34%), linear-gradient(145deg, #24201a, #080808)",
                    }}
                  />

                  <div className="relative z-10 flex w-full flex-col justify-between p-7 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <span className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
                        {article.category || "Sidra Journal"}
                      </span>

                      <time className="text-micro text-gray-300">
                        {formatJournalDate(article.publishedAt)}
                      </time>
                    </div>

                    <div className="max-w-2xl">
                      <h3
                        className={`font-display leading-[0.92] text-gold-100 ${
                          featureArticle
                            ? "text-[clamp(3.2rem,7vw,6.2rem)]"
                            : "text-[clamp(2.7rem,5vw,4.6rem)]"
                        }`}
                      >
                        {article.title}
                      </h3>

                      <p className="mt-5 line-clamp-4 text-caption leading-7 text-gray-300">
                        {article.excerpt}
                      </p>

                      <span className="mt-7 inline-flex items-center gap-3 text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                        Read the Story

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
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function NewsletterBlock({
  block,
}: {
  readonly block: HomepageBlock;
}): React.JSX.Element {
  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden border-t border-gold-500/15 bg-[color:rgba(28,28,28,0.36)] px-5 py-20 text-ivory-100 backdrop-blur-[2px] sm:px-8 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 20%, rgba(213,189,159,.18), transparent 28%), radial-gradient(circle at 84% 78%, rgba(122,82,45,.15), transparent 30%), linear-gradient(135deg, #070707, #17120d 52%, #070707)",
        }}
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl">
        <div className="grid w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-gold-500/25 bg-charcoal-800/70 shadow-modal backdrop-blur lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,.9fr)]">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              Private notes from Sidra
            </p>

            <h2 className="mt-6 max-w-4xl font-display text-[clamp(3.3rem,7vw,6.8rem)] leading-[0.86] text-gold-100">
              {text(
                block.data,
                "title",
                "A quieter kind of update",
              )}
            </h2>

            <p className="mt-7 max-w-2xl text-body-lg leading-8 text-gray-300">
              {text(
                block.data,
                "body",
                "New Studios, thoughtful objects, and stories from the makers.",
              )}
            </p>

            <NewsletterSignupForm />
          </div>

          <div className="relative min-h-[28rem] overflow-hidden border-t border-gold-500/15 lg:min-h-full lg:border-l lg:border-t-0">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 48% 40%, rgba(244,220,172,.34), transparent 17%), radial-gradient(circle at 50% 48%, rgba(213,189,159,.20), transparent 34%), linear-gradient(145deg, #2a2118, #1C1C1C 70%)",
              }}
            />

            <div
              aria-hidden="true"
              className="absolute left-[15%] top-[17%] h-56 w-56 rotate-12 rounded-[44%_56%_62%_38%/42%_46%_54%_58%] border border-gold-100/25 bg-gradient-to-br from-gold-100/20 via-gold-500/10 to-transparent shadow-gold-glow backdrop-blur sm:h-72 sm:w-72"
            />

            <div className="absolute inset-x-8 bottom-8 rounded-lg border border-gold-500/20 bg-black-950/65 p-6 backdrop-blur-md sm:inset-x-10 sm:bottom-10">
              <p className="break-words font-display text-h2 text-gold-100">
                Stories worth keeping.
              </p>

              <p className="mt-3 text-caption leading-7 text-gray-300">
                No public subscriber lists and no
                direct browser access to newsletter
                records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TestimonialsBlock({
  block,
  reviews,
}: {
  readonly block: HomepageBlock;
  readonly reviews: readonly ProductReview[];
}): React.JSX.Element {
  const limit = positiveInteger(
    block.data,
    "limit",
    6,
  );

  const visibleReviews = reviews
    .filter(
      (review) =>
        review.status === "published" &&
        review.verifiedPurchase === true &&
        review.productSlug.trim().length > 0 &&
        review.body.trim().length > 0,
    )
    .slice(0, limit);

  function displayCustomerName(
    customerName: string,
  ): string {
    const normalized = customerName.trim();

    if (!normalized) {
      return "Verified customer";
    }

    const parts = normalized
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0];
    }

    const lastPart =
      parts[parts.length - 1] ?? "";

    return `${parts[0]} ${lastPart.charAt(0)}.`;
  }

  return (
    <section className="relative w-full min-w-0 max-w-full overflow-hidden border-t border-gold-500/15 bg-[color:rgba(28,28,28,0.36)] px-5 py-20 text-ivory-100 backdrop-blur-[2px] sm:px-8 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-10 h-[34rem] w-[34rem] rounded-full bg-gold-500/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-amber-900/10 blur-3xl"
      />

      <div className="relative mx-auto w-full min-w-0 max-w-7xl">
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="max-w-4xl">
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              Verified purchase stories
            </p>

            <h2 className="mt-5 font-display text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.88] text-gold-100">
              {text(
                block.data,
                "title",
                "Collected with confidence",
              )}
            </h2>
          </div>

          <p className="text-body-lg leading-8 text-gray-300">
            Real feedback from completed Sidra
            purchases. Reviews appear here only
            after publication and purchase
            verification.
          </p>
        </header>

        {visibleReviews.length === 0 ? (
          <section className="mt-12 rounded-lg border border-gold-500/20 bg-charcoal-800 p-8 shadow-modal sm:p-10">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
              Verified customer reviews
            </p>

            <h3 className="mt-4 max-w-3xl font-display text-[clamp(2.6rem,6vw,5rem)] leading-none text-gold-100">
              The first published purchase stories
              will appear here.
            </h3>

            <p className="mt-6 max-w-2xl text-caption leading-7 text-gray-300">
              Pending, hidden and unverified reviews
              are never displayed in this section.
            </p>

            <Link
              href="/search?sort=featured"
              className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-gold-500 px-6 py-3 text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
            >
              Explore Sidra Pieces
            </Link>
          </section>
        ) : (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleReviews.map((review, index) => (
              <Link
                key={review.reviewId}
                href={`/product/${review.productSlug}`}
                className={`group relative flex min-h-[28rem] overflow-hidden rounded-lg border border-gold-500/20 bg-charcoal-800 p-7 shadow-card transition duration-slow ease-luxury hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-gold-glow sm:p-8 ${
                  index === 0
                    ? "md:col-span-2 lg:col-span-2"
                    : ""
                }`}
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full border border-gold-500/15 bg-gold-500/5 blur-2xl transition duration-cinematic group-hover:scale-125"
                />

                <article className="relative flex w-full flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <span
                      aria-label={`${review.rating} out of 5 stars`}
                      className="text-caption tracking-[0.18em] text-gold-500"
                    >
                      {"★".repeat(review.rating)}
                      {"☆".repeat(
                        5 - review.rating,
                      )}
                    </span>

                    <span className="rounded-full border border-gold-500/30 px-3 py-1 text-micro uppercase tracking-[0.12em] text-gold-100">
                      Verified purchase
                    </span>
                  </div>

                  <div className="mt-auto pt-16">
                    <p className="text-micro uppercase tracking-[0.16em] text-gray-400">
                      {review.productName ||
                        "Sidra piece"}
                    </p>

                    <h3
                      className={`mt-4 font-display leading-[0.92] text-gold-100 ${
                        index === 0
                          ? "text-[clamp(3rem,6vw,5.4rem)]"
                          : "text-[clamp(2.5rem,4vw,4rem)]"
                      }`}
                    >
                      {review.title}
                    </h3>

                    <blockquote className="mt-6 line-clamp-6 text-caption leading-7 text-gray-300">
                      “{review.body}”
                    </blockquote>

                    <div className="mt-7 border-t border-gold-500/20 pt-5">
                      <p className="text-caption font-semibold text-gold-100">
                        {displayCustomerName(
                          review.customerName,
                        )}
                      </p>

                      <p className="mt-1 text-micro uppercase tracking-[0.14em] text-gray-500">
                        Sidra customer
                      </p>
                    </div>

                    {review.sellerResponse ? (
                      <div className="mt-6 rounded-lg border border-gold-500/15 bg-black-950/60 p-4">
                        <p className="text-micro font-semibold uppercase tracking-[0.14em] text-gold-500">
                          Studio response
                        </p>

                        <p className="mt-2 line-clamp-3 text-micro leading-6 text-gray-300">
                          {review.sellerResponse}
                        </p>
                      </div>
                    ) : null}

                    <span className="mt-7 inline-flex items-center gap-3 text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                      View the Piece

                      <span
                        aria-hidden="true"
                        className="transition duration-base group-hover:translate-x-2"
                      >
                        →
                      </span>
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function EditorialBlock({
  block,
}: {
  readonly block: HomepageBlock;
}): React.JSX.Element {
  const items = strings(block.data, "items");

  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl px-5 py-16 sm:px-8">
      <p className="text-micro font-semibold uppercase tracking-[0.18em] text-gold-600">
        {block.type.replace(/([A-Z])/g, " $1").trim()}
      </p>

      <h2 className="mt-3 font-display text-[clamp(2.4rem,6vw,4.5rem)]">
        {text(
          block.data,
          "title",
          block.type.replace(/([A-Z])/g, " $1").trim(),
        )}
      </h2>

      {text(block.data, "body") ? (
        <p className="mt-4 max-w-2xl text-body-lg leading-8 text-gray-700">
          {text(block.data, "body")}
        </p>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <article
              key={item}
              className="w-full min-w-0 max-w-full break-words rounded-lg border border-gray-100 bg-ivory-50 p-5 font-display text-[clamp(2rem,10vw,4rem)] sm:p-6"
            >
              {item}
            </article>
          ))}
        </div>
      ) : null}

      {text(block.data, "ctaHref") ? (
        <Link
          className="mt-6 inline-flex rounded-lg border border-gray-100 px-5 py-3"
          href={text(block.data, "ctaHref")}
        >
          {text(block.data, "ctaLabel", "Explore")}
        </Link>
      ) : null}
    </section>
  );
}

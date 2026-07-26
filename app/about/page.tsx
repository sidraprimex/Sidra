import Link from "next/link";

const principles = [
  {
    number: "01",
    title: "Curated, never crowded.",
    body: "Sidra is designed around selected resin artists, meaningful collections and work that deserves space, context and attention.",
  },
  {
    number: "02",
    title: "Craft before commerce.",
    body: "Every product and Studio experience should preserve the maker’s story, material process and individual artistic identity.",
  },
  {
    number: "03",
    title: "Luxury through restraint.",
    body: "Cinematic movement, dimensional light and tactile digital details are used with purpose—not as decoration or visual noise.",
  },
  {
    number: "04",
    title: "Founder-controlled trust.",
    body: "Seller access, platform content, moderation, customer care and marketplace standards remain governed through Sidra’s central control system.",
  },
] as const;

export default function AboutPage(): React.JSX.Element {
  return (
    <main className="min-h-screen overflow-hidden bg-black-950 text-ivory-100">
      <section className="relative flex min-h-[88vh] items-end border-b border-gold-500/20 px-5 pb-16 pt-28 sm:px-8 lg:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-36 h-[38rem] w-[38rem] rounded-full bg-gold-500/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 rounded-full bg-ivory-100/5 blur-3xl"
        />

        <div className="relative mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="max-w-5xl">
            <p className="text-micro font-semibold uppercase tracking-[0.3em] text-gold-500">
              The house of extraordinary resin craft
            </p>

            <h1 className="mt-6 font-display text-[clamp(4.5rem,13vw,11rem)] leading-[0.75] tracking-[-0.055em]">
              About
              <span className="block text-gold-100">Sidra</span>
            </h1>
          </div>

          <div className="border-l border-gold-500/30 pl-6">
            <p className="text-body-lg leading-8 text-gray-300">
              A premium digital marketplace created to give resin artistry the
              presentation, trust and commercial infrastructure it deserves.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:py-28">
        <div>
          <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
            Our purpose
          </p>

          <h2 className="mt-5 font-display text-[clamp(3rem,7vw,6rem)] leading-[0.9]">
            More than a marketplace.
          </h2>
        </div>

        <div className="max-w-3xl space-y-7 text-body-lg leading-9 text-gray-300">
          <p>
            Sidra is being built as a private digital home for resin artists,
            collectors and customers looking for original, personalised and
            carefully presented craft.
          </p>

          <p>
            Instead of reducing handmade work to ordinary product cards, Sidra
            connects every approved artist with a dedicated Studio, their own
            collections, visual storytelling, custom-order tools and a complete
            commerce journey.
          </p>

          <p>
            Customers can discover artists, understand their process, explore
            their work, request custom pieces and continue the relationship
            through orders, reviews, support and Studio following.
          </p>
        </div>
      </section>

      <section className="border-y border-gold-500/20 bg-charcoal-800/70 px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto w-full max-w-7xl">
          <header className="max-w-4xl">
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              The Sidra standard
            </p>

            <h2 className="mt-5 font-display text-[clamp(3rem,7vw,6rem)] leading-[0.92]">
              Built around four principles.
            </h2>
          </header>

          <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-gold-500/20 bg-gold-500/20 md:grid-cols-2">
            {principles.map((principle) => (
              <article
                key={principle.number}
                className="min-h-72 bg-black-950 p-7 sm:p-9"
              >
                <span className="text-micro font-semibold tracking-[0.2em] text-gold-500">
                  {principle.number}
                </span>

                <h3 className="mt-12 max-w-md font-display text-[clamp(2.4rem,4vw,4rem)] leading-[0.95] text-gold-100">
                  {principle.title}
                </h3>

                <p className="mt-6 max-w-lg text-caption leading-7 text-gray-300">
                  {principle.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-gold-500/5 blur-3xl"
        />

        <div className="relative">
          <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
            For artists
          </p>

          <h2 className="mt-5 font-display text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.88]">
            Your work deserves its own world.
          </h2>

          <p className="mt-7 max-w-2xl text-body-lg leading-8 text-gray-300">
            Approved Sidra artists receive more than a seller profile. Each
            Studio is designed as a digital boutique with storytelling,
            collections, product media, custom orders, customer relationships
            and performance tools.
          </p>
        </div>

        <div className="relative rounded-lg border border-gold-500/20 bg-charcoal-800 p-8 shadow-modal sm:p-10">
          <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
            For collectors and customers
          </p>

          <h3 className="mt-4 font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none">
            Discover work with meaning.
          </h3>

          <p className="mt-6 text-caption leading-7 text-gray-300">
            Browse verified Studios, enter curated collections, commission
            personalised pieces and follow every order through one connected
            Sidra experience.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/studios"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gold-500 px-6 py-3 text-center text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
            >
              Explore Studios
            </Link>

            <Link
              href="/collections"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gold-500/40 px-6 py-3 text-center text-caption font-semibold text-gold-100 transition duration-base hover:border-gold-500 hover:bg-gold-500/10"
            >
              View Collections
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-gold-500/20 px-5 py-20 sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-4xl">
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              Made personally
            </p>

            <h2 className="mt-5 font-display text-[clamp(3rem,7vw,6rem)] leading-[0.9]">
              Begin with an artist or a custom idea.
            </h2>
          </div>

          <Link
            href="/custom-orders"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg border border-gold-500/50 px-7 py-3 text-caption font-semibold text-gold-100 transition duration-base hover:bg-gold-500 hover:text-black-950"
          >
            Start a Custom Order
          </Link>
        </div>
      </section>
    </main>
  );
}

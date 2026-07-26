import Link from "next/link";

const supportAreas = [
  {
    title: "Orders and delivery",
    description:
      "Get assistance with an existing order, its production progress, shipment or delivery.",
    href: "/account/orders",
    action: "View Orders",
  },
  {
    title: "Custom commissions",
    description:
      "Continue a quote, proof approval or conversation connected to your personalised piece.",
    href: "/account/custom-orders",
    action: "View Custom Orders",
  },
  {
    title: "Payments and refunds",
    description:
      "Open a secure request for payment confirmation, failed transactions, cancellations or refunds.",
    href: "/account/support/new",
    action: "Request Assistance",
  },
  {
    title: "Account and Studio help",
    description:
      "Get help with account access, profile details, seller applications or Studio-related questions.",
    href: "/account/support/new",
    action: "Contact Sidra Care",
  },
] as const;

const questions = [
  {
    question: "How do I contact Sidra Care?",
    answer:
      "Sign in to your Sidra account and open a private support request. Your conversation remains connected to your account and relevant order details.",
  },
  {
    question: "Can I track an existing order?",
    answer:
      "Yes. Open your Orders area to view the latest lifecycle status, shipment details and order timeline available for that purchase.",
  },
  {
    question: "Where do I continue a custom-order conversation?",
    answer:
      "Open Custom Orders inside your account. Each commission keeps its quote, proof approval and Studio conversation together.",
  },
  {
    question: "Can I submit sensitive payment information here?",
    answer:
      "Never share card PINs, passwords or one-time codes. Sidra Care only needs the transaction or order context required to investigate your request.",
  },
] as const;

export default function SupportPage(): React.JSX.Element {
  return (
    <main className="min-h-screen overflow-hidden bg-black-950 text-ivory-100">
      <section className="relative border-b border-gold-500/20 px-5 pb-16 pt-28 sm:px-8 lg:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[38rem] w-[38rem] rounded-full bg-gold-500/10 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-ivory-100/5 blur-3xl"
        />

        <div className="relative mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="max-w-5xl">
            <p className="text-micro font-semibold uppercase tracking-[0.3em] text-gold-500">
              Private customer assistance
            </p>

            <h1 className="mt-6 font-display text-[clamp(4.5rem,13vw,11rem)] leading-[0.75] tracking-[-0.055em]">
              Sidra
              <span className="block text-gold-100">Care</span>
            </h1>

            <p className="mt-8 max-w-3xl text-body-lg leading-8 text-gray-300">
              Receive secure assistance for orders, custom commissions,
              payments, accounts and Sidra Studios through one connected
              support experience.
            </p>
          </div>

          <div className="rounded-lg border border-gold-500/20 bg-charcoal-800/80 p-7 shadow-modal backdrop-blur">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
              Already signed in?
            </p>

            <h2 className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] leading-none">
              Open your private Support Centre.
            </h2>

            <div className="mt-7 grid gap-3">
              <Link
                href="/account/support"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gold-500 px-6 py-3 text-center text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
              >
                View Support Requests
              </Link>

              <Link
                href="/account/support/new"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gold-500/40 px-6 py-3 text-center text-caption font-semibold text-gold-100 transition duration-base hover:border-gold-500 hover:bg-gold-500/10"
              >
                Begin New Request
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <header className="max-w-4xl">
          <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
            Choose an area
          </p>

          <h2 className="mt-5 font-display text-[clamp(3rem,7vw,6rem)] leading-[0.9]">
            How can we help?
          </h2>
        </header>

        <div className="mt-14 grid gap-px overflow-hidden rounded-lg border border-gold-500/20 bg-gold-500/20 md:grid-cols-2">
          {supportAreas.map((area, index) => (
            <article
              key={area.title}
              className="group flex min-h-72 flex-col justify-between bg-charcoal-800 p-7 transition duration-slow hover:bg-charcoal-700 sm:p-9"
            >
              <div>
                <span className="text-micro font-semibold tracking-[0.2em] text-gold-500">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3 className="mt-10 font-display text-[clamp(2.4rem,4vw,4rem)] leading-[0.95] text-gold-100">
                  {area.title}
                </h3>

                <p className="mt-5 max-w-lg text-caption leading-7 text-gray-300">
                  {area.description}
                </p>
              </div>

              <Link
                href={area.href}
                className="mt-8 inline-flex w-fit items-center gap-3 text-micro font-semibold uppercase tracking-[0.17em] text-gold-500"
              >
                {area.action}
                <span
                  aria-hidden="true"
                  className="transition duration-base group-hover:translate-x-2"
                >
                  →
                </span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-gold-500/20 bg-charcoal-800/60 px-5 py-20 sm:px-8 lg:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              Before creating a request
            </p>

            <h2 className="mt-5 font-display text-[clamp(3rem,7vw,6rem)] leading-[0.9]">
              Keep the right details ready.
            </h2>
          </div>

          <div className="grid gap-4">
            {[
              "The email address connected to your Sidra account",
              "Your order or custom-order reference, when applicable",
              "A clear explanation of what happened and when",
              "Relevant screenshots without passwords, PINs or OTPs",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-start gap-5 rounded-lg border border-gold-500/15 bg-black-950 p-5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gold-500/40 text-micro font-semibold text-gold-100">
                  {index + 1}
                </span>

                <p className="pt-1 text-caption leading-7 text-gray-300">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.75fr_1.25fr] lg:py-28">
        <div>
          <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
            Common questions
          </p>

          <h2 className="mt-5 font-display text-[clamp(3rem,6vw,5.5rem)] leading-[0.92]">
            Support, clearly explained.
          </h2>
        </div>

        <div className="divide-y divide-gold-500/20 border-y border-gold-500/20">
          {questions.map((item) => (
            <details key={item.question} className="group py-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-body-lg font-semibold text-gold-100">
                <span>{item.question}</span>

                <span
                  aria-hidden="true"
                  className="text-gold-500 transition duration-base group-open:rotate-45"
                >
                  +
                </span>
              </summary>

              <p className="mt-5 max-w-3xl pr-8 text-caption leading-7 text-gray-300">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-gold-500/20 px-5 py-20 sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-4xl">
            <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
              New to Sidra?
            </p>

            <h2 className="mt-5 font-display text-[clamp(3rem,7vw,6rem)] leading-[0.9]">
              Create an account to keep support private and connected.
            </h2>
          </div>

          <div className="grid shrink-0 gap-3 sm:grid-cols-2">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gold-500/50 px-7 py-3 text-caption font-semibold text-gold-100 transition duration-base hover:bg-gold-500 hover:text-black-950"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gold-500 px-7 py-3 text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

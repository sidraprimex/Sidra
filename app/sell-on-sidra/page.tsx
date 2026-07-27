"use client";

import Link from "next/link";
import { useState } from "react";
import { ApplicationStatusPanel } from "@/components/seller-onboarding/ApplicationStatusPanel";
import { SellerApplicationForm } from "@/components/seller-onboarding/SellerApplicationForm";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";

const applicationSteps = [
  "Create and verify your Sidra account",
  "Submit your craft, portfolio and Studio details",
  "Sidra admin reviews quality and brand fit",
  "Approval provisions your complete Sidra Studio",
] as const;

export default function SellOnSidraPage(): React.JSX.Element {
  const { user, profile, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [hasApplication, setHasApplication] = useState<boolean | null>(null);

  if (loading) {
    return (
      <main className="min-h-screen bg-black-950 px-5 pb-24 pt-28 text-ivory-100 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <LoadingSkeleton count={4} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-black-950 pb-24 pt-24 text-ivory-100">
      <section className="relative border-b border-gold-500/20 px-5 pb-16 pt-10 sm:px-8 lg:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -top-40 h-[38rem] w-[38rem] rounded-full bg-gold-500/10 blur-3xl"
        />

        <div className="relative mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div className="max-w-5xl">
            <p className="text-micro font-semibold uppercase tracking-[0.28em] text-gold-500">
              Curated access for resin artists
            </p>

            <h1 className="mt-6 font-display text-[clamp(4rem,11vw,9rem)] leading-[0.78] tracking-[-0.05em]">
              Open Your
              <span className="block text-gold-100">Sidra Studio</span>
            </h1>

            <p className="mt-8 max-w-3xl text-body-lg leading-8 text-gray-300">
              Present your resin craft inside a private luxury storefront with
              collections, product storytelling, custom commissions, orders,
              customers and performance tools.
            </p>
          </div>

          <aside className="rounded-lg border border-gold-500/20 bg-charcoal-800/80 p-7 shadow-modal backdrop-blur">
            <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
              Curated marketplace
            </p>

            <p className="mt-4 text-caption leading-7 text-gray-300">
              Every application is reviewed. Submitting an application does not
              automatically publish a Studio.
            </p>

            <Link
              href="/studios"
              className="mt-6 inline-flex text-micro font-semibold uppercase tracking-[0.17em] text-gold-100"
            >
              Explore approved Studios →
            </Link>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[22rem_minmax(0,1fr)] lg:py-24">
        <aside>
          <p className="text-micro font-semibold uppercase tracking-[0.22em] text-gold-500">
            Application journey
          </p>

          <ol className="mt-7 space-y-5">
            {applicationSteps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-4 border-b border-gold-500/15 pb-5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gold-500/40 text-micro font-semibold text-gold-100">
                  {index + 1}
                </span>

                <span className="pt-1 text-caption leading-6 text-gray-300">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </aside>

        <div>
          {!user ? (
            <section className="rounded-lg border border-gold-500/20 bg-charcoal-800 p-8 shadow-modal sm:p-10">
              <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
                Account required
              </p>

              <h2 className="mt-4 font-display text-[clamp(2.8rem,6vw,5rem)] leading-none text-gold-100">
                Sign in before applying.
              </h2>

              <p className="mt-6 max-w-2xl text-caption leading-7 text-gray-300">
                Your verified Sidra account securely owns your portfolio,
                application history and future Studio.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/login?next=/sell-on-sidra"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gold-500 px-6 py-3 text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
                >
                  Sign In
                </Link>

                <Link
                  href="/register?next=/sell-on-sidra"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gold-500/40 px-6 py-3 text-caption font-semibold text-gold-100 transition duration-base hover:bg-gold-500/10"
                >
                  Create Account
                </Link>
              </div>
            </section>
          ) : !user.emailVerified ? (
            <section className="rounded-lg border border-gold-500/20 bg-charcoal-800 p-8 shadow-modal sm:p-10">
              <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
                Email verification required
              </p>

              <h2 className="mt-4 font-display text-[clamp(2.8rem,6vw,5rem)] leading-none text-gold-100">
                Confirm your email first.
              </h2>

              <p className="mt-6 max-w-2xl text-caption leading-7 text-gray-300">
                Verification protects your portfolio and the Studio identity
                created after admin approval.
              </p>

              <Link
                href="/verify-email?next=/sell-on-sidra"
                className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-gold-500 px-6 py-3 text-caption font-semibold text-black-950 transition duration-base hover:bg-gold-100"
              >
                Continue to Verification
              </Link>
            </section>
          ) : (
            <section>
              <div className="mb-8 rounded-lg border border-gold-500/20 bg-charcoal-800 p-6">
                <p className="text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                  Applying as
                </p>

                <p className="mt-2 font-display text-h2 text-gold-100">
                  {profile?.fullName || user.displayName || user.email}
                </p>
              </div>

              <ApplicationStatusPanel
                uid={user.uid}
                onPresenceChange={setHasApplication}
              />

              {!submitted && hasApplication === false ? (
                <div className="mt-8 rounded-lg bg-ivory-100 p-5 text-black-900 sm:p-8">
                  <SellerApplicationForm
                    uid={user.uid}
                    email={user.email ?? ""}
                    onSubmitted={() => {
                      setSubmitted(true);
                    }}
                  />
                </div>
              ) : null}

              {submitted ? (
                <div className="mt-8 rounded-lg border border-success/30 bg-charcoal-800 p-8">
                  <p className="text-micro font-semibold uppercase tracking-[0.2em] text-success">
                    Application received
                  </p>

                  <h2 className="mt-4 font-display text-h1 text-gold-100">
                    Your Studio application is under review.
                  </h2>

                  <p className="mt-4 text-caption leading-7 text-gray-300">
                    Your live Pending, Approved or Rejected status will remain available on this page and inside the Buyer Dashboard menu.
                  </p>
                </div>
              ) : null}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

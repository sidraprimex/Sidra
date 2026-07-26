"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NavigationItem } from "@/types/content";

interface MobileNavigationProps {
  readonly items: readonly NavigationItem[];
  readonly authenticated: boolean;
  readonly authLoading: boolean;
  readonly accountHref: string;
  readonly firstName: string;
}

export function MobileNavigation({
  items,
  authenticated,
  authLoading,
  accountHref,
  firstName,
}: MobileNavigationProps): React.JSX.Element {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="inline-flex min-h-11 items-center gap-3 rounded-lg border border-gold-500/35 px-4 py-2 text-micro font-semibold uppercase tracking-[0.14em] text-gold-100"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label="Open navigation menu"
      >
        <span className="flex w-4 flex-col gap-1" aria-hidden="true">
          <span className="h-px w-full bg-current" />
          <span className="h-px w-full bg-current" />
          <span className="h-px w-full bg-current" />
        </span>
        Menu
      </button>

      {open ? (
        <div
          id="mobile-navigation"
          className="fixed inset-0 z-50 overflow-y-auto bg-black-950 text-ivory-100"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-gold-500/10 blur-3xl"
          />

          <div className="relative flex min-h-screen flex-col">
            <header className="flex h-20 items-center justify-between border-b border-gold-500/20 px-5 sm:px-8">
              <Link
                href="/"
                className="font-display text-h3 tracking-[0.2em] text-gold-100"
              >
                SIDRA
              </Link>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                }}
                className="inline-flex min-h-11 items-center rounded-lg border border-gold-500/40 px-4 py-2 text-micro font-semibold uppercase tracking-[0.14em] text-gold-100"
                aria-label="Close navigation menu"
              >
                Close
              </button>
            </header>

            <div className="flex flex-1 flex-col px-5 pb-8 pt-8 sm:px-8">
              <p className="text-micro font-semibold uppercase tracking-[0.24em] text-gold-500">
                Explore Sidra
              </p>

              <nav
                aria-label="Mobile navigation"
                className="mt-6 divide-y divide-gold-500/15 border-y border-gold-500/15"
              >
                {items.map((item, index) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex items-center justify-between gap-5 py-4"
                  >
                    <span className="font-display text-[clamp(2rem,9vw,3.8rem)] leading-none text-gold-100">
                      {item.label}
                    </span>

                    <span className="flex items-center gap-3">
                      <span className="text-micro text-gray-500">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span
                        aria-hidden="true"
                        className="text-gold-500 transition duration-base group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </span>
                  </Link>
                ))}
              </nav>

              <div className="mt-8 rounded-lg border border-gold-500/20 bg-charcoal-800 p-5">
                <p className="text-micro font-semibold uppercase tracking-[0.18em] text-gold-500">
                  Resin artists
                </p>

                <p className="mt-3 text-caption leading-6 text-gray-300">
                  Apply for a curated Sidra Studio and build your private
                  luxury storefront.
                </p>

                <Link
                  href="/sell-on-sidra"
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-gold-500/50 px-5 py-3 text-caption font-semibold text-gold-100"
                >
                  Open Your Studio
                </Link>
              </div>

              <div className="mt-4 grid gap-3">
                {authLoading ? (
                  <span className="h-12 animate-pulse rounded-lg bg-ivory-100/10" />
                ) : authenticated ? (
                  <Link
                    href={accountHref}
                    className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gold-500 px-5 py-3 text-caption font-semibold text-black-950"
                  >
                    Hello, {firstName}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex min-h-12 items-center justify-center rounded-lg border border-gold-500/40 px-5 py-3 text-caption font-semibold text-gold-100"
                    >
                      Sign In
                    </Link>

                    <Link
                      href="/register"
                      className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gold-500 px-5 py-3 text-caption font-semibold text-black-950"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

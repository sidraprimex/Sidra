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
    if (!open) {
      return;
    }

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
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:rgba(213,189,159,0.28)] bg-[color:rgba(28,28,28,0.48)] px-3.5 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-porcelain)] backdrop-blur-md"
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
          className="fixed inset-0 z-50 overflow-y-auto bg-[var(--color-deep-onyx)] text-[var(--color-porcelain)]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,167,176,0.16),transparent_26%),radial-gradient(circle_at_left,rgba(213,189,159,0.12),transparent_24%)]"
          />

          <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col">
            <header className="flex h-16 items-center justify-between border-b border-[color:rgba(213,189,159,0.16)] px-4 sm:h-20 sm:px-6">
              <Link
                href="/"
                className="font-display text-[1.15rem] tracking-[0.34em] text-[var(--color-porcelain)] sm:text-[1.35rem]"
              >
                SIDRA
              </Link>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                }}
                className="inline-flex min-h-10 items-center rounded-full border border-[color:rgba(213,189,159,0.3)] px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-porcelain)]"
                aria-label="Close navigation menu"
              >
                Close
              </button>
            </header>

            <div className="flex flex-1 flex-col px-4 pb-8 pt-6 sm:px-6">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-champagne)]">
                Explore Sidra
              </p>

              <nav aria-label="Mobile navigation" className="mt-5 space-y-3">
                {items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group flex items-center justify-between rounded-[1.35rem] border border-[color:rgba(213,189,159,0.14)] bg-[color:rgba(59,30,53,0.18)] px-4 py-4 transition hover:border-[color:rgba(213,189,159,0.3)] hover:bg-[color:rgba(59,30,53,0.34)]"
                  >
                    <span className="font-display text-[clamp(1.9rem,9vw,3.2rem)] leading-none text-[var(--color-porcelain)]">
                      {item.label}
                    </span>

                    <span
                      aria-hidden="true"
                      className="text-[1rem] text-[var(--color-champagne)] transition group-hover:translate-x-1"
                    >
                      ↗
                    </span>
                  </Link>
                ))}
              </nav>

              <div className="mt-6 rounded-[1.5rem] border border-[color:rgba(213,189,159,0.16)] bg-[color:rgba(59,30,53,0.78)] p-5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-champagne)]">
                  Resin artists
                </p>

                <p className="mt-3 text-sm leading-7 text-white/72">
                  Apply for a curated Sidra Studio and build your private luxury storefront.
                </p>

                <Link
                  href="/sell-on-sidra"
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[color:rgba(213,189,159,0.35)] px-5 py-3 text-[0.78rem] font-semibold text-[var(--color-porcelain)]"
                >
                  Open Your Studio
                </Link>
              </div>

              <div className="mt-4 grid gap-3">
                {authLoading ? (
                  <span className="h-12 animate-pulse rounded-full bg-white/10" />
                ) : authenticated ? (
                  <Link
                    href={accountHref}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-dusty-rose)] px-5 py-3 text-[0.82rem] font-semibold text-[var(--color-deep-onyx)]"
                  >
                    Hello, {firstName}
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:rgba(213,189,159,0.22)] px-5 py-3 text-[0.82rem] font-semibold text-[var(--color-porcelain)]"
                    >
                      Sign In
                    </Link>

                    <Link
                      href="/register"
                      className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--color-champagne)] px-5 py-3 text-[0.82rem] font-semibold text-[var(--color-deep-onyx)]"
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

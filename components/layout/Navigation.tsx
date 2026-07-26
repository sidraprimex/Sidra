"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { foundationContent } from "@/cms/foundationContent";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { useAuth } from "@/hooks/useAuth";

const ADMIN_ROLES = new Set([
  "support",
  "contentManager",
  "financeManager",
  "marketingManager",
  "founder",
  "superAdmin",
]);

function resolveAccountHref(
  role: string | undefined,
  studioId: string | undefined,
): string {
  if (role && ADMIN_ROLES.has(role)) {
    return "/admin/overview";
  }

  if (role === "seller" && studioId) {
    return "/studio-admin/overview";
  }

  return "/account/dashboard";
}

function resolveFirstName(
  fullName: string | null | undefined,
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const candidate =
    fullName?.trim() ||
    displayName?.trim() ||
    email?.split("@")[0]?.trim() ||
    "Account";

  return candidate.split(/\s+/)[0] || "Account";
}

export function Navigation(): React.JSX.Element {
  const { user, profile, claims, loading } = useAuth();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const updateHeader = (): void => {
      setSolid(window.scrollY > 24);
    };

    updateHeader();

    window.addEventListener("scroll", updateHeader, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", updateHeader);
    };
  }, []);

  const accountHref = resolveAccountHref(
    claims?.role ?? profile?.role,
    claims?.studioId ?? profile?.studioId ?? undefined,
  );

  const firstName = resolveFirstName(
    profile?.fullName,
    user?.displayName,
    user?.email,
  );

  const enabledItems = foundationContent.navigation.filter(
    (item) => item.enabled,
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 text-ivory-100 transition duration-slow ease-luxury ${
        solid
          ? "border-b border-gold-500/20 bg-black-950/90 shadow-card backdrop-blur-xl"
          : "bg-gradient-to-b from-black-950/75 via-black-950/30 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link
          href="/"
          aria-label="Sidra home"
          className="relative z-10 shrink-0 font-display text-h3 tracking-[0.2em] text-gold-100 transition duration-base hover:text-gold-500"
        >
          SIDRA
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden min-w-0 items-center gap-4 xl:flex"
        >
          {enabledItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="whitespace-nowrap text-micro font-semibold uppercase tracking-[0.12em] text-gray-300 transition duration-base hover:text-gold-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <Link
            href="/sell-on-sidra"
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gold-500/40 px-4 py-2 text-micro font-semibold uppercase tracking-[0.12em] text-gold-100 transition duration-base hover:border-gold-500 hover:bg-gold-500/10"
          >
            Open a Studio
          </Link>

          {loading ? (
            <span
              aria-label="Loading account"
              className="h-10 w-28 animate-pulse rounded-lg bg-ivory-100/10"
            />
          ) : user ? (
            <Link
              href={accountHref}
              className="inline-flex min-h-10 max-w-40 items-center justify-center truncate rounded-lg bg-gold-500 px-4 py-2 text-micro font-semibold text-black-950 transition duration-base hover:bg-gold-100"
            >
              Hello, {firstName}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex min-h-10 items-center justify-center px-2 py-2 text-micro font-semibold uppercase tracking-[0.12em] text-gray-200 transition duration-base hover:text-gold-100"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-gold-500 px-4 py-2 text-micro font-semibold text-black-950 transition duration-base hover:bg-gold-100"
              >
                Create Account
              </Link>
            </>
          )}
        </div>

        <MobileNavigation
          items={enabledItems}
          authenticated={Boolean(user)}
          authLoading={loading}
          accountHref={accountHref}
          firstName={firstName}
        />
      </div>
    </header>
  );
}

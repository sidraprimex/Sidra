"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, claims, loading } = useAuth();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const updateHeader = (): void => {
      setSolid(window.scrollY > 18);
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


  const showBackButton = pathname !== "/";

  const goBack = (): void => {
    if (
      typeof window !== "undefined" &&
      window.history.length > 1
    ) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition duration-slow ease-luxury ${
        solid
          ? "border-b border-[color:rgba(213,189,159,0.18)] bg-[color:rgba(28,28,28,0.88)] backdrop-blur-xl"
          : "bg-[linear-gradient(180deg,rgba(28,28,28,0.92),rgba(28,28,28,0.42),transparent)]"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            aria-label="Sidra home"
            className="shrink-0 font-display text-[1.15rem] tracking-[0.34em] text-[var(--color-porcelain)] transition hover:text-[var(--color-champagne)] sm:text-[1.35rem]"
          >
            SIDRA
          </Link>
        </div>

        <nav
          aria-label="Primary navigation"
          className="hidden min-w-0 items-center gap-5 xl:flex"
        >
          {enabledItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="whitespace-nowrap text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/72 transition hover:text-[var(--color-porcelain)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          <Link
            href="/sell-on-sidra"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[color:rgba(213,189,159,0.35)] bg-[color:rgba(59,30,53,0.55)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-porcelain)] transition hover:border-[var(--color-champagne)] hover:bg-[color:rgba(59,30,53,0.84)]"
          >
            Open a Studio
          </Link>

          {loading ? (
            <span
              aria-label="Loading account"
              className="h-10 w-28 animate-pulse rounded-full bg-white/10"
            />
          ) : user ? (
            <Link
              href={accountHref}
              className="inline-flex min-h-10 max-w-40 items-center justify-center truncate rounded-full bg-[var(--color-dusty-rose)] px-4 py-2 text-[0.72rem] font-semibold text-[var(--color-deep-onyx)] transition hover:opacity-90"
            >
              Hello, {firstName}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex min-h-10 items-center justify-center px-2 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white/78 transition hover:text-[var(--color-porcelain)]"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--color-champagne)] px-4 py-2 text-[0.72rem] font-semibold text-[var(--color-deep-onyx)] transition hover:opacity-90"
              >
                Create Account
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          {showBackButton ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[color:rgba(213,189,159,0.3)] bg-[color:rgba(59,30,53,0.58)] px-3.5 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-porcelain)] backdrop-blur-xl transition hover:border-[var(--color-champagne)] hover:bg-[color:rgba(59,30,53,0.82)]"
            >
              Back
            </button>
          ) : null}

          <MobileNavigation
            items={enabledItems}
            authenticated={Boolean(user)}
            authLoading={loading}
            accountHref={accountHref}
            firstName={firstName}
          />
        </div>
      </div>
    </header>
  );
}

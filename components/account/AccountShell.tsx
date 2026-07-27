"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { logout } from "@/services/authService";

interface AccountShellProps {
  readonly title: string;
  readonly eyebrow: string;
  readonly children: ReactNode;
  readonly mode?: "customer" | "seller" | "admin";
}

const customerLinks = [
  ["Overview", "/account/dashboard"],
  ["Orders", "/account/orders"],
  ["Custom orders", "/account/custom-orders"],
  ["Wishlist", "/account/wishlist"],
  ["Notifications", "/account/notifications"],
  ["Support", "/account/support"],
] as const;

const sellerLinks = [
  ["Overview", "/studio-admin/overview"],
  ["Products", "/studio-admin/products"],
  ["Orders", "/studio-admin/orders"],
  ["Custom orders", "/studio-admin/custom-orders"],
  ["Customers", "/studio-admin/customers"],
  ["Analytics", "/studio-admin/analytics"],
  ["Payouts", "/studio-admin/payouts"],
] as const;

const adminLinks = [
  ["Overview", "/admin/overview"],
  ["Control center", "/admin/control-center"],
  ["Seller applications", "/admin/sellers/applications"],
  ["Products", "/admin/products"],
  ["Content", "/admin/content"],
  ["Finance", "/admin/finance"],
  ["Support", "/admin/support"],
  ["Security", "/admin/security"],
] as const;

export function AccountShell({
  title,
  eyebrow,
  children,
  mode = "customer",
}: AccountShellProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const links = mode === "seller" ? sellerLinks : mode === "admin" ? adminLinks : customerLinks;

  return (
    <main className="min-h-screen w-full overflow-x-clip bg-[radial-gradient(circle_at_top_right,rgba(217,167,176,0.13),transparent_25%),radial-gradient(circle_at_left_30%,rgba(213,189,159,0.15),transparent_22%),linear-gradient(180deg,var(--color-porcelain),#f4ece9)] px-4 pb-16 pt-5 text-[var(--color-deep-onyx)] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="sticky top-3 z-40 rounded-[1.4rem] border border-[rgba(59,30,53,0.12)] bg-[rgba(248,244,240,0.86)] px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur-xl sm:px-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Link href="/" className="shrink-0 font-display text-xl tracking-[0.28em] text-[var(--color-deep-plum)]">SIDRA</Link>
            <div className="flex items-center gap-2">
              <Link href="/" className="hidden rounded-full border border-[rgba(59,30,53,0.16)] px-4 py-2 text-xs font-semibold sm:inline-flex">Storefront</Link>
              <button
                type="button"
                className="rounded-full bg-[var(--color-deep-plum)] px-4 py-2 text-xs font-semibold text-[var(--color-porcelain)] transition hover:opacity-90"
                onClick={async () => {
                  await logout();
                  router.replace("/");
                }}
              >
                Sign out
              </button>
            </div>
          </div>
          <nav className="mt-3 flex w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={`${mode} dashboard navigation`}>
            {links.map(([label, href]) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${active ? "bg-[var(--color-dusty-rose)] text-[var(--color-deep-onyx)]" : "border border-[rgba(59,30,53,0.12)] bg-white/55 text-[var(--color-gray-700)] hover:border-[var(--color-champagne)]"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </header>

        <section className="py-10 sm:py-14">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-dusty-rose)]">{eyebrow}</p>
          <h1 className="mt-3 max-w-5xl break-words font-display text-[clamp(2.7rem,8vw,6.4rem)] leading-[0.9] text-[var(--color-deep-plum)]">{title}</h1>
          <div className="mt-8 min-w-0">{children}</div>
        </section>
      </div>
    </main>
  );
}

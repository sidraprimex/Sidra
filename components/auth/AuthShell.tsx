"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  alternate?: { label: string; href: string; action: string };
}

export function AuthShell({ eyebrow, title, description, children, alternate }: AuthShellProps) {
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, []);

  return (
    <main className="relative isolate min-h-[100svh] overflow-x-hidden bg-[linear-gradient(145deg,#1c1c1c_0%,#251d22_55%,#3b1e35_100%)] text-[var(--color-porcelain)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(213,189,159,0.22),transparent_28%),radial-gradient(circle_at_88%_78%,rgba(217,167,176,0.14),transparent_32%)]" />
      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col px-4 pb-8 pt-5 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <header className="flex items-center justify-between gap-4 rounded-full border border-white/10 bg-black/15 px-4 py-3 backdrop-blur-xl sm:px-5">
          <Link href="/" className="font-display text-xl tracking-[0.3em] text-[var(--color-porcelain)]">SIDRA</Link>
          <Link href="/search" className="rounded-full border border-white/15 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-white/80">Browse products</Link>
        </header>

        <div className="grid flex-1 items-center gap-8 py-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.82fr)] lg:gap-16">
          <section className="max-w-xl px-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[var(--color-champagne)]">{eyebrow}</p>
            <h1 className="mt-4 max-w-2xl font-display text-[clamp(3rem,11vw,6.6rem)] leading-[0.9] text-[var(--color-porcelain)]">{title}</h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/68 sm:text-base">{description}</p>
          </section>

          <section className="w-full rounded-[1.8rem] border border-white/12 bg-[rgba(28,28,28,0.76)] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:p-8 lg:p-9">
            {children}
            {alternate ? <p className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-white/65">{alternate.label} <Link href={alternate.href} className="font-semibold text-[var(--color-champagne)] underline decoration-white/20 underline-offset-4">{alternate.action}</Link></p> : null}
          </section>
        </div>
      </div>
    </main>
  );
}

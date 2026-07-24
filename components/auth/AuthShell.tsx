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

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  alternate,
}: AuthShellProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="relative isolate min-h-[100svh] overflow-x-hidden bg-black-950 text-ivory-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(200,169,106,0.18),transparent_30%),radial-gradient(circle_at_88%_78%,rgba(239,227,203,0.08),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px bg-white/[0.06] lg:block" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl flex-col px-5 pb-6 pt-14 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display text-h3 tracking-[0.24em] text-ivory-100 transition duration-base hover:text-gold-100"
          >
            SIDRA
          </Link>
          <span className="text-micro uppercase tracking-[0.2em] text-gray-500">
            Secure access
          </span>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.82fr)] lg:gap-16 lg:py-14">
          <section className="max-w-xl">
            <p className="text-micro uppercase tracking-[0.28em] text-gold-500">
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-2xl font-display text-h1 leading-[1.02] text-ivory-100 sm:text-hero">
              {title}
            </h1>
            <p className="mt-5 max-w-lg text-body leading-relaxed text-gray-300 sm:text-body-lg">
              {description}
            </p>
          </section>

          <section className="w-full rounded-[1.75rem] border border-white/10 bg-charcoal-800/88 p-5 shadow-modal backdrop-blur-2xl sm:p-8 lg:p-9">
            {children}
            {alternate ? (
              <p className="mt-7 border-t border-white/10 pt-6 text-center text-caption text-gray-300">
                {alternate.label}{" "}
                <Link
                  href={alternate.href}
                  className="font-medium text-gold-500 underline decoration-gold-500/40 underline-offset-4 transition duration-fast hover:text-gold-100"
                >
                  {alternate.action}
                </Link>
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

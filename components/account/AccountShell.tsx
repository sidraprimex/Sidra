"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/services/authService";
import { useRouter } from "next/navigation";

export function AccountShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-ivory-100 px-4 py-10 text-black-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-gray-300 pb-6">
          <Link href="/" className="font-display text-h3 tracking-[0.2em]">SIDRA</Link>
          <button
            type="button"
            className="text-caption text-gray-700 underline decoration-gray-300 underline-offset-4"
            onClick={async () => { await logout(); router.replace("/"); }}
          >
            Sign out
          </button>
        </header>
        <section className="py-12">
          <p className="text-caption uppercase tracking-[0.24em] text-gold-600">{eyebrow}</p>
          <h1 className="mt-3 font-display text-h1">{title}</h1>
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}

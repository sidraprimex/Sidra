"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navigation } from "@/components/layout/Navigation";
import { OpeningCinematic } from "@/components/motion/OpeningCinematic";

const standalonePrefixes = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/not-authorized",
  "/account",
  "/admin",
  "/studio-admin",
] as const;

function isStandaloneRoute(pathname: string) {
  return standalonePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function SiteFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const standalone = isStandaloneRoute(pathname);

  if (standalone) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-porcelain)]">
      {pathname === "/" ? <OpeningCinematic /> : null}
      <Navigation />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

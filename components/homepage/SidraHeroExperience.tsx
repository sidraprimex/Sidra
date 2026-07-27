"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { SIDRA_HERO_IMAGES } from "@/components/homepage/sidraMediaManifest";
import { useAuth } from "@/hooks/useAuth";

interface SidraHeroExperienceProps {
  readonly eyebrow: string;
  readonly headline: string;
  readonly subhead: string;
  readonly primaryCtaLabel: string;
  readonly primaryCtaHref: string;
  readonly secondaryCtaLabel: string;
  readonly secondaryCtaHref: string;
}

const LAST_HERO_KEY = "sidra-last-hero-image";

function safeHref(value: string, fallback: string): string {
  return value.startsWith("/") ? value : fallback;
}

function resolveFirstName(
  fullName?: string | null,
  displayName?: string | null,
  email?: string | null,
): string | null {
  const value =
    fullName?.trim() ||
    displayName?.trim() ||
    email?.split("@")[0]?.trim();

  return value?.split(/\s+/)[0] || null;
}

function chooseNextImage(): string {
  let previous = "";

  try {
    previous = window.localStorage.getItem(LAST_HERO_KEY) ?? "";
  } catch {
    previous = "";
  }

  const candidates = SIDRA_HERO_IMAGES.filter(
    (image) => image !== previous,
  );

  const pool =
    candidates.length > 0 ? candidates : SIDRA_HERO_IMAGES;

  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);

  const selected = pool[values[0] % pool.length];

  try {
    window.localStorage.setItem(LAST_HERO_KEY, selected);
  } catch {
    // Storage may be unavailable.
  }

  return selected;
}

export function SidraHeroExperience({
  eyebrow,
  headline,
  subhead,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
}: SidraHeroExperienceProps): React.JSX.Element {
  const fallbackImage: string =
    SIDRA_HERO_IMAGES[0];

  const [selectedImage, setSelectedImage] =
    useState<string>(fallbackImage);

  const [ready, setReady] = useState(false);
  const { loading, profile, user } = useAuth();

  useEffect(() => {
    setSelectedImage(chooseNextImage());
    setReady(true);
  }, []);

  const greeting = useMemo(() => {
    const name = resolveFirstName(
      profile?.fullName,
      user?.displayName,
      user?.email,
    );

    return !loading && name ? `Hello, ${name}` : eyebrow;
  }, [
    eyebrow,
    loading,
    profile?.fullName,
    user?.displayName,
    user?.email,
  ]);

  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-[var(--color-deep-onyx)] text-[var(--color-porcelain)] md:min-h-[78svh] lg:min-h-[82svh]">
      <motion.div
        key={selectedImage}
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{
          opacity: ready ? 1 : 0.75,
          scale: 1,
          x: ready ? 0 : "1%",
        }}
        transition={{
          opacity: { duration: 1.1, ease: "easeOut" },
          scale: { duration: 8, ease: "easeOut" },
          x: { duration: 8, ease: "easeOut" },
        }}
        className="absolute inset-0"
      >
        <Image
          src={selectedImage}
          alt="Luxury handcrafted resin artwork"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,28,28,0.12),rgba(59,30,53,0.38)_46%,rgba(28,28,28,0.94))] md:bg-[linear-gradient(90deg,rgba(28,28,28,0.95),rgba(59,30,53,0.62)_54%,rgba(28,28,28,0.15))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(217,167,176,0.16),transparent_30%),radial-gradient(circle_at_24%_76%,rgba(213,189,159,0.13),transparent_28%)]" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl items-end px-4 pb-12 pt-24 sm:px-8 sm:pb-20 md:min-h-[78svh] lg:min-h-[82svh] lg:px-12 lg:pb-20">
        <div className="w-full min-w-0 max-w-4xl">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--color-champagne)] sm:text-xs">
            {greeting}
          </p>

          <h1 className="mt-5 max-w-[17ch] break-words font-display text-[clamp(2.8rem,11vw,7.4rem)] leading-[0.86] tracking-[-0.035em]">
            {headline}
          </h1>

          <p className="mt-6 max-w-2xl text-sm leading-7 text-[color:rgba(248,244,240,0.78)] sm:text-lg sm:leading-8">
            {subhead}
          </p>

          <div className="mt-8 grid w-full max-w-xl gap-3 sm:flex sm:flex-wrap">
            <Link
              href={safeHref(primaryCtaHref, "/studios")}
              className="inline-flex min-h-13 w-full items-center justify-center rounded-[1rem] bg-[var(--color-dusty-rose)] px-6 py-3 text-sm font-semibold text-[var(--color-deep-onyx)] transition hover:bg-[var(--color-porcelain)] sm:w-auto"
            >
              {primaryCtaLabel}
              <span className="ml-4" aria-hidden="true">→</span>
            </Link>

            <Link
              href={safeHref(
                secondaryCtaHref,
                "/collections",
              )}
              className="inline-flex min-h-13 w-full items-center justify-center rounded-[1rem] border border-[color:rgba(213,189,159,0.5)] bg-[color:rgba(28,28,28,0.52)] px-6 py-3 text-sm font-semibold text-[var(--color-porcelain)] backdrop-blur-xl transition hover:bg-[var(--color-deep-plum)] sm:w-auto"
            >
              {secondaryCtaLabel}
            </Link>
          </div>

          <p className="mt-7 text-[0.6rem] uppercase tracking-[0.22em] text-white/48">
            A different Sidra artwork appears on every visit
          </p>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  watchRuntimePolicy,
  type RuntimePolicyOverride,
} from "@/services/runtimeCmsService";

interface LegalPolicyPageProps {
  readonly policyId: "privacy" | "noRefund" | "shipping" | "terms";
  readonly eyebrow: string;
  readonly title: string;
  readonly children: ReactNode;
}

export function LegalPolicyPage({
  policyId,
  eyebrow,
  title,
  children,
}: LegalPolicyPageProps): React.JSX.Element {
  const [override, setOverride] =
    useState<RuntimePolicyOverride | null>(null);

  useEffect(
    () =>
      watchRuntimePolicy(
        policyId,
        setOverride,
        () => setOverride(null),
      ),
    [policyId],
  );

  const paragraphs = override?.body
    ? override.body
        .split(/\n\s*\n/)
        .map((item) => item.trim())
        .filter(Boolean)
    : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(217,167,176,.18),transparent_30%),linear-gradient(180deg,#fbf8f5,#f4ebe8)] px-5 pb-16 pt-28 text-[var(--color-deep-onyx)] sm:px-8 sm:pt-32">
      <article className="mx-auto max-w-5xl rounded-[var(--radius-lg)] border border-[rgba(59,30,53,.12)] bg-white/80 p-6 shadow-[0_26px_75px_rgba(59,30,53,.08)] sm:p-10 lg:p-14">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-dusty-rose)]">
          {override?.eyebrow ?? eyebrow}
        </p>

        <h1 className="mt-4 font-display text-[clamp(2.8rem,8vw,6rem)] leading-[.96] text-[var(--color-deep-plum)]">
          {override?.title ?? title}
        </h1>

        <div className="mt-10 space-y-7 text-base leading-8 text-[rgba(31,24,29,.78)]">
          {paragraphs
            ? paragraphs.map((paragraph, index) => (
                <p key={`${index}-${paragraph}`}>
                  {paragraph}
                </p>
              ))
            : children}
        </div>
      </article>
    </main>
  );
}

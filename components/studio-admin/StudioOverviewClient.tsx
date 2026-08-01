"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { SellerGrowthDashboard } from "@/components/studio-admin/SellerGrowthDashboard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { getSellerAnalyticsSummary } from "@/services/sellerGrowthService";
import type { SellerAnalyticsSummary } from "@/types/phase11-seller-growth";
import { getSellerStudio } from "@/services/studioStorefrontService";

const empty: SellerAnalyticsSummary = { grossSalesPaise: 0, netSalesPaise: 0, orderCount: 0, customOrderCount: 0, averageOrderValuePaise: 0, conversionRate: 0, repeatCustomerRate: 0, refundRate: 0, wishlistCount: 0, followerCount: 0 };

export function StudioOverviewClient(): React.JSX.Element {
  const auth = useRouteGuard({ allowedRoles: ["seller", "founder", "superAdmin"], requireStudioId: true });
  const [summary, setSummary] = useState<SellerAnalyticsSummary | null>(null);
  const [studioSlug, setStudioSlug] = useState("");
  useEffect(() => {
    if (!auth.claims?.studioId) return;
    void Promise.all([getSellerAnalyticsSummary(auth.claims.studioId), getSellerStudio(auth.claims.studioId)]).then(([nextSummary, studio]) => { setSummary(nextSummary); setStudioSlug(studio?.slug ?? ""); }).catch(() => setSummary(empty));
  }, [auth.claims?.studioId]);
  if (auth.loading || !auth.user || !auth.claims?.studioId || !summary) return <LoadingSkeleton count={8} />;
  const storePath = studioSlug ? `/studio/${studioSlug}` : "";
  return <AccountShell mode="seller" eyebrow="Studio administration" title="Your Studio"><div className="grid gap-7"><section className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-gold-600)]">Your independent Sidra store</p><h2 className="mt-3 font-heading text-3xl">Share, list and customize</h2><p className="mt-3 break-all text-sm text-muted">{storePath || "Your public store is being prepared."}</p><div className="mt-5 flex flex-wrap gap-3">{storePath ? <><Link href={storePath} target="_blank" className="rounded-full border border-border px-5 py-3 text-sm font-semibold">Open store</Link><button type="button" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}${storePath}`)} className="rounded-full border border-border px-5 py-3 text-sm font-semibold">Copy URL</button></> : null}<Link href="/studio-admin/storefront" className="rounded-full bg-[var(--color-deep-plum)] px-5 py-3 text-sm font-semibold text-white">Customize store</Link><Link href="/studio-admin/products/new" className="rounded-full bg-[var(--color-gold-600)] px-5 py-3 text-sm font-semibold text-white">List product</Link></div></section><SellerGrowthDashboard summary={summary} /></div></AccountShell>;
}

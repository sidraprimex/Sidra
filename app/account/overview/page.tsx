"use client";

import { AccountShell } from "@/components/account/AccountShell";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export default function AccountOverviewPage() {
  const auth = useRouteGuard({ requireVerifiedEmail: true });
  if (auth.loading || !auth.user) return <LoadingSkeleton />;
  return (
    <AccountShell eyebrow="Collector account" title={`Welcome, ${auth.profile?.fullName?.split(" ")[0] || "Collector"}.`}>
      <div className="grid gap-5 sm:grid-cols-2">
        <section className="rounded-lg bg-ivory-50 p-6 shadow-card"><p className="text-caption uppercase tracking-[0.18em] text-gray-500">Identity</p><p className="mt-3 text-body-lg">{auth.user.email}</p><p className="mt-2 text-caption text-success">Verified private access</p></section>
        <section className="rounded-lg bg-ivory-50 p-6 shadow-card"><p className="text-caption uppercase tracking-[0.18em] text-gray-500">Role</p><p className="mt-3 font-display text-h3 capitalize">{auth.claims?.role ?? "customer"}</p><p className="mt-2 text-caption text-gray-500">Studio access requires Founder approval.</p></section>
      </div>
    </AccountShell>
  );
}

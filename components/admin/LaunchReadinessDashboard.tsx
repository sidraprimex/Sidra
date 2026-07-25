"use client";
import { useCallback, useEffect, useState } from "react";
import { getLaunchReadinessSummary } from "@/services/launchReadinessService";
import type { LaunchReadinessSummary } from "@/types/phase13-launch-readiness";

export function LaunchReadinessDashboard(): React.JSX.Element {
  const [summary, setSummary] = useState<LaunchReadinessSummary | null>(null);
  const refresh = useCallback(async () => setSummary(await getLaunchReadinessSummary()), []);
  useEffect(() => { void refresh(); }, [refresh]);
  if (!summary) return <p className="rounded-[var(--radius-lg)] border border-border bg-card p-8 text-muted">Loading verified release evidence.</p>;
  return <div className="grid gap-6"><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Passed gates" value={`${summary.passedGates}/${summary.totalGates}`} /><Metric label="Open signals" value={summary.openSignals} /><Metric label="Critical or high bugs" value={summary.unresolvedCriticalBugs} /><Metric label="Production state" value={summary.readyForProduction ? "Ready" : "Blocked"} /></section><section className="grid gap-3">{summary.evidence.map((item) => <article key={item.evidenceId} className="rounded-[var(--radius-lg)] border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-heading text-xl">{item.evidenceId}</h2><span className="rounded-full border border-border px-3 py-1 text-xs">{item.status}</span></div><p className="mt-3 text-sm leading-6 text-muted">{item.summary || "No measured evidence recorded yet."}</p><p className="mt-2 text-xs text-muted">Method: {item.method || "Not recorded"}</p></article>)}</section></div>;
}
function Metric({ label, value }: { readonly label: string; readonly value: string | number }): React.JSX.Element { return <article className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p><p className="mt-3 font-heading text-3xl">{value}</p></article>; }

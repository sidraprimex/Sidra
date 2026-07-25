"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { listOpenSecuritySignals, reviewSecuritySignal } from "@/services/launchReadinessService";
import type { Phase13SecuritySignal, SecuritySignalStatus } from "@/types/phase13-launch-readiness";

export function SecuritySignalDashboard(): React.JSX.Element {
  const [items, setItems] = useState<readonly Phase13SecuritySignal[]>([]);
  const refresh = useCallback(async () => setItems(await listOpenSecuritySignals()), []);
  useEffect(() => { void refresh(); }, [refresh]);
  async function move(signalId: string, status: SecuritySignalStatus) { await reviewSecuritySignal(signalId, status); await refresh(); }
  return <div className="grid gap-4">{items.map((item) => <article key={item.signalId} className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.16em] text-muted">{item.type}</p><h2 className="mt-2 font-heading text-2xl">{item.summary}</h2></div><span className="rounded-full border border-border px-3 py-1 text-xs">{item.status}</span></div><p className="mt-4 text-sm leading-6 text-muted">Observed {item.occurrenceCount} times. Signals are review-only and never suspend an account automatically.</p><div className="mt-5 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => void move(item.signalId, "reviewing")}>Review</Button><Button variant="outline" onClick={() => void move(item.signalId, "confirmed")}>Confirm signal</Button><Button variant="ghost" onClick={() => void move(item.signalId, "dismissed")}>Dismiss</Button></div></article>)}{items.length === 0 ? <p className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">No unresolved fraud or abuse signals.</p> : null}</div>;
}

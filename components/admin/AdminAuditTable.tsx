import type { AdminAuditLog } from "@/types/phase10-founder-admin";
export function AdminAuditTable({ entries }: { readonly entries: readonly AdminAuditLog[] }): React.JSX.Element {
  return <div className="grid gap-4">{entries.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">No audit events.</div> : entries.map((e) => <article key={e.auditId} className="rounded-[var(--radius-lg)] border border-border bg-card p-5"><div className="flex justify-between gap-3"><p className="font-medium">{e.action}</p><span className="text-xs text-muted">{e.createdAt}</span></div><p className="mt-2 font-mono text-sm text-muted">{e.entityType}:{e.entityId}</p></article>)}</div>;
}

"use client";
import { useState } from "react";
import { savePlatformContent } from "@/services/founderAdminService";
import type { PlatformContentEntry } from "@/types/phase10-founder-admin";

export function PlatformContentManager({ initialEntries }: { readonly initialEntries: readonly PlatformContentEntry[] }): React.JSX.Element {
  const [entries, setEntries] = useState(initialEntries);
  const [namespace, setNamespace] = useState("global");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("published");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const result = await savePlatformContent({ namespace, key, value, description, status });
      setEntries((current) => [{ contentId: result.contentId, namespace, key, value, description, status, updatedBy: "founder", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...current]);
      setKey(""); setValue(""); setDescription("");
    } finally { setBusy(false); }
  };
  return <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
    <section className="grid gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-6">
      <h2 className="font-heading text-3xl">Create content control</h2>
      <label className="grid gap-2"><span>Namespace</span><input value={namespace} onChange={(e) => setNamespace(e.target.value)} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Key</span><input value={key} onChange={(e) => setKey(e.target.value)} placeholder="homepage.hero.title" className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Visible content</span><textarea rows={5} value={value} onChange={(e) => setValue(e.target.value)} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Internal description</span><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
      <label className="grid gap-2"><span>Status</span><select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3"><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></label>
      <button disabled={busy || !key.trim() || !value.trim()} onClick={() => void submit()} className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50">{busy ? "Saving…" : "Save content"}</button>
    </section>
    <section className="grid content-start gap-4">{entries.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">No managed content yet.</div> : entries.map((entry) =>
      <article key={entry.contentId} className="rounded-[var(--radius-lg)] border border-border bg-card p-5"><div className="flex justify-between gap-3"><p className="text-xs uppercase tracking-[0.14em] text-muted">{entry.namespace}</p><span className="text-xs">{entry.status}</span></div><h3 className="mt-3 font-mono text-sm">{entry.key}</h3><p className="mt-4 whitespace-pre-wrap leading-7">{entry.value}</p></article>)}</section>
  </div>;
}

"use client";

import { useState } from "react";
import { reviewCustomOrderProof, submitCustomOrderProof } from "@/services/customOrderService";
import type { CustomOrderProof } from "@/types/phase8-custom-orders";

export function ProofApprovalPanel({
  customOrderId,
  proofs,
  role,
}: {
  readonly customOrderId: string;
  readonly proofs: readonly CustomOrderProof[];
  readonly role: "customer" | "seller";
}): React.JSX.Element {
  const [urls, setUrls] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const latest = proofs[proofs.length - 1] ?? null;

  const submitProof = async () => {
    setBusy(true);
    try {
      await submitCustomOrderProof({
        customOrderId,
        imageUrls: urls.split("\n").map((item) => item.trim()).filter((item) => item.startsWith("https://")),
        note,
      });
      setUrls("");
      setNote("");
    } finally {
      setBusy(false);
    }
  };

  const review = async (decision: "approve" | "requestRevision") => {
    if (!latest) return;
    setBusy(true);
    try {
      await reviewCustomOrderProof({
        customOrderId,
        proofId: latest.proofId,
        decision,
        reason: decision === "requestRevision" ? reason : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  return <section className="rounded-[var(--radius-lg)] border border-border bg-card p-6">
    <h2 className="font-heading text-2xl">Production proof</h2>
    {latest ? <div className="mt-5 grid gap-4"><p className="text-sm text-muted">Revision {latest.revisionNumber} · {latest.status}</p><div className="grid gap-3 sm:grid-cols-2">{latest.imageUrls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="rounded-[var(--radius-md)] border border-border p-4 text-sm">Open proof image</a>)}</div><p className="leading-7">{latest.note}</p></div> : <p className="mt-4 text-sm text-muted">No proof uploaded yet.</p>}
    {role === "seller" ? <div className="mt-6 grid gap-3"><textarea rows={3} value={urls} onChange={(event) => setUrls(event.target.value)} placeholder="One proof image HTTPS URL per line" className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Explain what the customer should review" className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /><button disabled={busy || !urls.includes("https://") || note.trim().length < 10} onClick={() => void submitProof()} className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50">Submit proof</button></div> : null}
    {role === "customer" && latest?.status === "pendingApproval" ? <div className="mt-6 grid gap-3"><textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Revision reason, required only when requesting changes" className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /><div className="flex flex-wrap gap-3"><button disabled={busy} onClick={() => void review("approve")} className="rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50">Approve proof</button><button disabled={busy || reason.trim().length < 8} onClick={() => void review("requestRevision")} className="rounded-[var(--radius-md)] border border-border px-5 py-3 disabled:opacity-50">Request revision</button></div></div> : null}
  </section>;
}

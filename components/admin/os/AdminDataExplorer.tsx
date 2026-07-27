"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  deleteAdminDocument,
  listAdminCollection,
  setAdminDocument,
  toEditableRecord,
} from "@/services/adminOperatingService";
import type { AdminRecord } from "@/types/admin-os";

const suggestedCollections = [
  "users",
  "studios",
  "sellerApplications",
  "products",
  "orders",
  "customOrders",
  "supportTickets",
  "messages",
  "payments",
  "manualPaymentRequests",
  "payouts",
  "categories",
  "collections",
  "cms",
  "settings",
  "notifications",
  "reviews",
  "adminAuditLogs",
] as const;

export function AdminDataExplorer({ actorUid }: { readonly actorUid: string }) {
  const [collectionName, setCollectionName] = useState("users");
  const [records, setRecords] = useState<readonly AdminRecord[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [jsonValue, setJsonValue] = useState("{}");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    setMessage(null);
    try {
      setRecords(await listAdminCollection(collectionName, 300));
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Collection could not be loaded.");
    } finally {
      setBusy(false);
    }
  };

  const select = (record: AdminRecord) => {
    setDocumentId(record.id);
    setJsonValue(JSON.stringify(toEditableRecord(record.data), null, 2));
  };

  const save = async () => {
    if (!collectionName.trim() || !documentId.trim()) {
      setMessage("Collection name and document ID are required.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const parsed = JSON.parse(jsonValue) as unknown;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        throw new Error("Document JSON must be an object.");
      }
      await setAdminDocument({
        collectionName: collectionName.trim(),
        documentId: documentId.trim(),
        value: parsed as Record<string, unknown>,
        actorUid,
        action: "database.document.save",
        summary: `Admin saved ${collectionName}/${documentId}`,
      });
      setMessage("Document saved and audit logged.");
      await load();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Document could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!documentId.trim()) return;
    if (!window.confirm(`Permanently delete ${collectionName}/${documentId}? This cannot be undone.`)) return;
    setBusy(true);
    setMessage(null);
    try {
      await deleteAdminDocument({ collectionName, documentId, actorUid });
      setMessage("Document permanently deleted and audit logged.");
      setDocumentId("");
      setJsonValue("{}");
      await load();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Document could not be deleted.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
      <Card elevated className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">Firestore explorer</p>
        <h2 className="mt-3 font-display text-4xl text-[var(--color-deep-plum)]">Every collection in one room</h2>
        <p className="mt-3 text-sm leading-7 text-gray-700">Search any collection, open a document, safely edit JSON, create a new document or permanently delete it. Every action is audit logged.</p>

        <label className="mt-6 grid gap-2 text-sm font-semibold">
          Collection
          <input
            list="sidra-admin-collections"
            value={collectionName}
            onChange={(event) => setCollectionName(event.target.value)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
          />
          <datalist id="sidra-admin-collections">
            {suggestedCollections.map((item) => <option key={item} value={item} />)}
          </datalist>
        </label>

        <Button className="mt-4 w-full" loading={busy} onClick={() => void load()}>Load collection</Button>

        <div className="mt-6 max-h-[34rem] space-y-2 overflow-y-auto pr-1">
          {records.map((record) => (
            <button
              type="button"
              key={record.id}
              onClick={() => select(record)}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${documentId === record.id ? "border-[var(--color-deep-plum)] bg-[var(--color-deep-plum)] text-white" : "border-black/10 bg-white/70"}`}
            >
              <span className="block truncate font-semibold">{record.id}</span>
              <span className="mt-1 block truncate text-xs opacity-70">{Object.keys(record.data).slice(0, 6).join(" · ")}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card elevated className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">Document editor</p>
            <h2 className="mt-2 font-display text-4xl text-[var(--color-deep-plum)]">Edit source data</h2>
          </div>
          <button type="button" onClick={() => { setDocumentId(crypto.randomUUID()); setJsonValue("{}"); }} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold">New document</button>
        </div>

        <label className="mt-6 grid gap-2 text-sm font-semibold">
          Document ID
          <input value={documentId} onChange={(event) => setDocumentId(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3" />
        </label>

        <label className="mt-4 grid gap-2 text-sm font-semibold">
          JSON data
          <textarea value={jsonValue} onChange={(event) => setJsonValue(event.target.value)} className="min-h-[28rem] w-full rounded-2xl border border-black/10 bg-[#1c1c1c] p-4 font-mono text-xs leading-6 text-[#f8f4f0]" spellCheck={false} />
        </label>

        {message ? <p className="mt-4 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm leading-6">{message}</p> : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button loading={busy} onClick={() => void save()}>Save document</Button>
          <Button variant="danger" disabled={!documentId} loading={busy} onClick={() => void remove()}>Delete permanently</Button>
        </div>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { AdminCmsWorkspace } from "@/components/admin/os/AdminCmsWorkspace";
import { AdminDataExplorer } from "@/components/admin/os/AdminDataExplorer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import {
  loadAdminSnapshot,
  toEditableRecord,
  updateAdminDocument,
} from "@/services/adminOperatingService";
import type { AdminRecord, AdminSnapshot, AdminWorkspaceTab } from "@/types/admin-os";

const tabs: readonly { readonly id: AdminWorkspaceTab; readonly label: string; readonly description: string }[] = [
  { id: "overview", label: "Overview", description: "Platform command summary" },
  { id: "search", label: "Global search", description: "Users, sellers, orders and tickets" },
  { id: "users", label: "Users", description: "Roles, blocks and accounts" },
  { id: "sellers", label: "Sellers", description: "Studios and approvals" },
  { id: "products", label: "Products", description: "Moderation and visibility" },
  { id: "orders", label: "Orders", description: "Tracking and payment status" },
  { id: "support", label: "Support", description: "Tickets and manual payments" },
  { id: "content", label: "CMS", description: "Words, sections and media" },
  { id: "appearance", label: "Appearance", description: "Global colors and styling" },
  { id: "payments", label: "Payments", description: "Razorpay, UPI and bank mode" },
  { id: "database", label: "Firebase data", description: "Collection and document explorer" },
  { id: "audit", label: "Audit log", description: "Every admin decision" },
] as const;

const adminRoles = ["admin", "support", "contentManager", "financeManager", "marketingManager", "seller", "customer"] as const;

function text(record: AdminRecord, ...keys: readonly string[]): string {
  for (const key of keys) {
    const value = record.data[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return record.id;
}

function bool(record: AdminRecord, key: string): boolean {
  return record.data[key] === true;
}

function collectionForTab(tab: AdminWorkspaceTab): keyof AdminSnapshot | null {
  if (tab === "users") return "users";
  if (tab === "sellers") return "studios";
  if (tab === "products") return "products";
  if (tab === "orders") return "orders";
  if (tab === "audit") return "auditLogs";
  return null;
}

function recordTitle(collectionName: string, record: AdminRecord): string {
  if (collectionName === "users") return text(record, "fullName", "email");
  if (collectionName === "studios") return text(record, "name", "studioName");
  if (collectionName === "products") return text(record, "name", "productName");
  if (collectionName === "orders") return text(record, "orderNumber", "orderId");
  if (collectionName === "supportTickets") return text(record, "subject", "ticketId");
  if (collectionName === "manualPaymentRequests") return `Manual payment ${record.id.slice(0, 8)}`;
  if (collectionName === "sellerApplications") return text(record, "studioName", "fullName");
  return text(record, "summary", "action", "name", "title");
}

function recordSubtitle(collectionName: string, record: AdminRecord): string {
  if (collectionName === "users") return `${text(record, "email")} · ${text(record, "role")} · ${text(record, "status")}`;
  if (collectionName === "studios") return `${text(record, "slug")} · ${bool(record, "active") ? "Active" : "Suspended"}`;
  if (collectionName === "products") return `${text(record, "status")} · Studio ${text(record, "studioId")}`;
  if (collectionName === "orders") return `${text(record, "orderStatus", "status")} · ${text(record, "paymentStatus")}`;
  if (collectionName === "supportTickets") return `${text(record, "category")} · ${text(record, "status")}`;
  if (collectionName === "manualPaymentRequests") return `${text(record, "status")} · ₹${Number(record.data.totalPaise ?? 0) / 100}`;
  if (collectionName === "sellerApplications") return `${text(record, "status")} · ${text(record, "email")}`;
  return `${record.id} · ${Object.keys(record.data).slice(0, 5).join(" · ")}`;
}

function searchRecord(record: AdminRecord, collectionName: string, search: string): boolean {
  if (!search.trim()) return true;
  const haystack = `${collectionName} ${record.id} ${JSON.stringify(toEditableRecord(record.data))}`.toLowerCase();
  return haystack.includes(search.trim().toLowerCase());
}

function MetricCard({ label, value, href }: { readonly label: string; readonly value: number; readonly href?: string }) {
  const content = <Card elevated className="h-full"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">{label}</p><p className="mt-4 font-display text-6xl text-[var(--color-deep-plum)]">{value}</p><p className="mt-3 text-xs text-gray-700">Open control →</p></Card>;
  return href ? <Link href={href}>{content}</Link> : content;
}

function RecordEditor({ collectionName, record, actorUid, onClose, onSaved }: { readonly collectionName: string; readonly record: AdminRecord; readonly actorUid: string; readonly onClose: () => void; readonly onSaved: () => Promise<void> }) {
  const [json, setJson] = useState(JSON.stringify(toEditableRecord(record.data), null, 2));
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true); setMessage(null);
    try {
      const parsed = JSON.parse(json) as unknown;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("Document JSON must be an object.");
      await updateAdminDocument({ collectionName, documentId: record.id, patch: parsed as Record<string, unknown>, actorUid, action: `${collectionName}.admin.edit`, summary: `Admin edited ${collectionName}/${record.id}` });
      await onSaved();
      onClose();
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Changes could not be saved."); }
    finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/55 p-4 backdrop-blur-sm"><div className="mx-auto my-6 max-w-4xl rounded-[2rem] bg-[#fbf7f3] p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">{collectionName}</p><h2 className="mt-2 break-all font-display text-4xl text-[var(--color-deep-plum)]">{record.id}</h2></div><button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white">✕</button></div><textarea value={json} onChange={(event) => setJson(event.target.value)} className="mt-5 min-h-[32rem] w-full rounded-2xl bg-[#1c1c1c] p-4 font-mono text-xs leading-6 text-[#f8f4f0]" spellCheck={false} />{message ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{message}</p> : null}<div className="mt-5 grid gap-3 sm:grid-cols-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button loading={busy} onClick={() => void save()}>Save and audit</Button></div></div></div>;
}

export function AdminOperatingSystem(): React.JSX.Element {
  const auth = useRouteGuard({ allowedRoles: ["admin", "founder", "superAdmin"] });
  const [tab, setTab] = useState<AdminWorkspaceTab>("overview");
  const [snapshot, setSnapshot] = useState<AdminSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ collectionName: string; record: AdminRecord } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true); setError(null);
    try { setSnapshot(await loadAdminSnapshot()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Admin data could not be loaded."); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (auth.user) void reload(); }, [auth.user]);
  useEffect(() => {
    const fromHash = window.location.hash.replace("#", "") as AdminWorkspaceTab;
    if (tabs.some((item) => item.id === fromHash)) setTab(fromHash);
  }, []);

  const filteredSearch = useMemo(() => {
    if (!snapshot) return [];
    const entries = Object.entries(snapshot) as Array<
      [keyof AdminSnapshot, readonly AdminRecord[]]
    >;

    return entries
      .flatMap(([collectionName, records]) =>
        records
          .filter((record) =>
            searchRecord(record, collectionName, search),
          )
          .map((record) => ({ collectionName, record })),
      )
      .slice(0, 100);
  }, [search, snapshot]);

  const patch = async (collectionName: string, record: AdminRecord, patchValue: Record<string, unknown>, action: string, summary: string) => {
    if (!auth.user) return;
    const key = `${collectionName}:${record.id}:${action}`;
    setBusyKey(key); setMessage(null);
    try {
      await updateAdminDocument({ collectionName, documentId: record.id, patch: patchValue, actorUid: auth.user.uid, action, summary });
      setMessage(summary);
      await reload();
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Action could not be completed."); }
    finally { setBusyKey(null); }
  };

  if (auth.loading || !auth.user) return <LoadingSkeleton count={8} />;
  if (loading && !snapshot) return <LoadingSkeleton count={8} />;
  if (error && !snapshot) return <ErrorState message={error} onRetry={() => void reload()} />;
  if (!snapshot) return <LoadingSkeleton count={8} />;

  const actorUid = auth.user.uid;
  const pendingApplications = snapshot.sellerApplications.filter((item) => ["pending", "moreInfoRequested", "onHold", "provisioningFailed"].includes(String(item.data.status))).length;
  const openSupport = snapshot.supportTickets.filter((item) => item.data.status !== "closed").length;
  const activeStudios = snapshot.studios.filter((item) => item.data.active === true).length;
  const liveProducts = snapshot.products.filter((item) => item.data.status === "published").length;
  const pendingManual = snapshot.manualPaymentRequests.filter((item) => item.data.status === "pendingVerification").length;

  const renderRecords = (collectionName: keyof AdminSnapshot, title: string, description: string) => {
    const records = snapshot[collectionName].filter((record) => searchRecord(record, collectionName, search));
    return <div className="grid gap-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">{description}</p><h2 className="mt-2 font-display text-5xl text-[var(--color-deep-plum)]">{title}</h2></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} className="w-full rounded-full border border-black/10 bg-white px-5 py-3 sm:max-w-sm" /></div>{records.length === 0 ? <Card elevated><p className="text-sm text-gray-700">No matching records.</p></Card> : <div className="grid gap-4 lg:grid-cols-2">{records.map((record) => {
      const keyPrefix = `${collectionName}:${record.id}`;
      return <Card key={record.id} elevated className="min-w-0"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-display text-3xl text-[var(--color-deep-plum)]">{recordTitle(collectionName, record)}</p><p className="mt-2 break-words text-xs leading-6 text-gray-700">{recordSubtitle(collectionName, record)}</p></div><button type="button" onClick={() => setEditing({ collectionName, record })} className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold">Edit all</button></div>
      {collectionName === "users" ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><select value={String(record.data.role ?? "customer")} onChange={(event) => void patch("users", record, { role: event.target.value }, "user.role.change", `Changed ${recordTitle("users", record)} role to ${event.target.value}`)} className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm">{adminRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select><Button variant={record.data.status === "suspended" ? "primary" : "danger"} loading={busyKey === `${keyPrefix}:user.status.change`} onClick={() => void patch("users", record, { status: record.data.status === "suspended" ? "active" : "suspended" }, "user.status.change", `${record.data.status === "suspended" ? "Activated" : "Suspended"} ${recordTitle("users", record)}`)}>{record.data.status === "suspended" ? "Activate account" : "Suspend account"}</Button></div> : null}
      {collectionName === "studios" ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><Button variant={record.data.active === true ? "danger" : "primary"} onClick={() => void patch("studios", record, { active: record.data.active !== true, status: record.data.active === true ? "suspended" : "active" }, "studio.status.change", `${record.data.active === true ? "Suspended" : "Activated"} Studio ${recordTitle("studios", record)}`)}>{record.data.active === true ? "Suspend Studio" : "Activate Studio"}</Button><Button variant="outline" onClick={() => void patch("studios", record, { featured: record.data.featured !== true }, "studio.feature.change", `${record.data.featured === true ? "Removed" : "Added"} featured Studio placement`)}>{record.data.featured === true ? "Remove featured" : "Feature Studio"}</Button></div> : null}
      {collectionName === "products" ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><Button variant={record.data.status === "published" ? "danger" : "primary"} onClick={() => void patch("products", record, { status: record.data.status === "published" ? "hidden" : "published" }, "product.status.change", `${record.data.status === "published" ? "Hidden" : "Published"} ${recordTitle("products", record)}`)}>{record.data.status === "published" ? "Hide product" : "Publish product"}</Button><Button variant="outline" onClick={() => void patch("products", record, { featured: record.data.featured !== true }, "product.feature.change", `${record.data.featured === true ? "Removed" : "Added"} featured product placement`)}>{record.data.featured === true ? "Remove featured" : "Feature product"}</Button></div> : null}
      {collectionName === "orders" ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><select value={String(record.data.orderStatus ?? record.data.status ?? "placed")} onChange={(event) => void patch("orders", record, { orderStatus: event.target.value, status: event.target.value }, "order.status.change", `Changed order ${record.id} to ${event.target.value}`)} className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm">{["placed","accepted","inProduction","qualityCheck","packaged","readyToShip","shipped","inTransit","outForDelivery","delivered","completed","cancelled","returned"].map((status) => <option key={status} value={status}>{status}</option>)}</select><select value={String(record.data.paymentStatus ?? "pending")} onChange={(event) => void patch("orders", record, { paymentStatus: event.target.value }, "order.payment.change", `Changed order ${record.id} payment to ${event.target.value}`)} className="rounded-2xl border border-black/10 bg-white px-3 py-3 text-sm">{["pending","paid","failed","refunded","partiallyRefunded"].map((status) => <option key={status} value={status}>{status}</option>)}</select></div> : null}
      {collectionName === "auditLogs" ? <pre className="mt-5 max-h-56 overflow-auto rounded-2xl bg-[#1c1c1c] p-4 text-xs leading-6 text-[#f8f4f0]">{JSON.stringify(toEditableRecord(record.data), null, 2)}</pre> : null}
      </Card>})}</div>}</div>;
  };

  const renderSupport = () => <div className="grid gap-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">Customer care and money review</p><h2 className="mt-2 font-display text-5xl text-[var(--color-deep-plum)]">Support operations</h2></div><Link href="/admin/support" className="rounded-full bg-[var(--color-deep-plum)] px-5 py-3 text-center text-sm font-semibold text-white">Open message queue</Link></div><div className="grid gap-6 lg:grid-cols-2"><section className="grid gap-4"><h3 className="font-display text-3xl">Tickets</h3>{snapshot.supportTickets.map((record) => <Card key={record.id} elevated><div className="flex items-start justify-between gap-3"><div><p className="font-display text-2xl text-[var(--color-deep-plum)]">{recordTitle("supportTickets", record)}</p><p className="mt-2 text-xs text-gray-700">{recordSubtitle("supportTickets", record)}</p></div><button type="button" onClick={() => setEditing({ collectionName: "supportTickets", record })} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold">Edit</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Button variant={record.data.status === "closed" ? "primary" : "outline"} onClick={() => void patch("supportTickets", record, { status: record.data.status === "closed" ? "open" : "closed" }, "support.status.change", `${record.data.status === "closed" ? "Reopened" : "Closed"} support ticket ${record.id}`)}>{record.data.status === "closed" ? "Reopen" : "Close ticket"}</Button><Link href={`/account/support/${record.id}`} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-black/10 bg-white px-4 text-sm font-semibold">Open conversation</Link></div></Card>)}</section><section className="grid gap-4"><h3 className="font-display text-3xl">Manual payment verification</h3>{snapshot.manualPaymentRequests.length === 0 ? <Card elevated><p className="text-sm text-gray-700">No manual payment requests yet.</p></Card> : snapshot.manualPaymentRequests.map((record) => <Card key={record.id} elevated><div className="flex items-start justify-between gap-3"><div><p className="font-display text-2xl text-[var(--color-deep-plum)]">₹{Number(record.data.totalPaise ?? 0) / 100}</p><p className="mt-2 text-xs leading-6 text-gray-700">Reference: {text(record, "paymentReference")}<br />Customer: {text(record, "customerId")}<br />Status: {text(record, "status")}</p></div><button type="button" onClick={() => setEditing({ collectionName: "manualPaymentRequests", record })} className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold">Edit</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Button onClick={() => void patch("manualPaymentRequests", record, { status: "verified", verifiedBy: actorUid }, "payment.manual.verify", `Verified manual payment ${record.id}`)}>Verify payment</Button><Button variant="danger" onClick={() => void patch("manualPaymentRequests", record, { status: "rejected", verifiedBy: actorUid }, "payment.manual.reject", `Rejected manual payment ${record.id}`)}>Reject</Button></div></Card>)}</section></div></div>;

  const renderOverview = () => <div className="grid gap-8"><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label="All users" value={snapshot.users.length} href="#users" /><MetricCard label="Active Studios" value={activeStudios} href="#sellers" /><MetricCard label="Live products" value={liveProducts} href="#products" /><MetricCard label="Open support" value={openSupport} href="#support" /><MetricCard label="Payment checks" value={pendingManual} href="#support" /></section><div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><Card elevated><p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">Admin authority</p><h2 className="mt-3 font-display text-5xl text-[var(--color-deep-plum)]">One operating room for the whole platform</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-gray-700">Search every account, suspend users and Studios, publish products, change orders, verify payments, reply to support, edit homepage JSON, control colors and directly inspect Firebase collections. Every save writes an audit record.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setTab("search")} className="rounded-2xl bg-[var(--color-deep-plum)] px-5 py-4 text-left font-semibold text-white">Global platform search →</button><button type="button" onClick={() => setTab("database")} className="rounded-2xl border border-[var(--color-deep-plum)] px-5 py-4 text-left font-semibold text-[var(--color-deep-plum)]">Open Firebase explorer →</button></div></Card><Card elevated><p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">Needs your decision</p><div className="mt-4 space-y-3"><Link href="/admin/sellers/applications" className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4 text-sm font-semibold"><span>Seller applications</span><span>{pendingApplications}</span></Link><button type="button" onClick={() => setTab("support")} className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white p-4 text-sm font-semibold"><span>Open support tickets</span><span>{openSupport}</span></button><button type="button" onClick={() => setTab("support")} className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-white p-4 text-sm font-semibold"><span>Manual payments</span><span>{pendingManual}</span></button></div></Card></div></div>;

  const renderSearch = () => <div className="grid gap-6"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">Universal lookup</p><h2 className="mt-2 font-display text-5xl text-[var(--color-deep-plum)]">Search the entire Sidra database</h2><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, phone, order ID, Studio, product, ticket…" className="mt-6 w-full rounded-full border border-black/10 bg-white px-6 py-4 text-base shadow-card" /></div><div className="grid gap-4 lg:grid-cols-2">{filteredSearch.map(({ collectionName, record }) => <Card key={`${collectionName}:${record.id}`} elevated><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--color-dusty-rose)]">{collectionName}</p><h3 className="mt-2 font-display text-3xl text-[var(--color-deep-plum)]">{recordTitle(collectionName, record)}</h3><p className="mt-2 text-xs leading-6 text-gray-700">{recordSubtitle(collectionName, record)}</p><Button variant="outline" className="mt-4" onClick={() => setEditing({ collectionName, record })}>Open full record</Button></Card>)}</div></div>;

  const selectedCollection = collectionForTab(tab);
  let workspace: React.JSX.Element;
  if (tab === "overview") workspace = renderOverview();
  else if (tab === "search") workspace = renderSearch();
  else if (selectedCollection) workspace = renderRecords(selectedCollection, tabs.find((item) => item.id === tab)?.label ?? tab, tabs.find((item) => item.id === tab)?.description ?? "");
  else if (tab === "support") workspace = renderSupport();
  else if (["content", "appearance", "payments"].includes(tab)) workspace = <AdminCmsWorkspace actorUid={actorUid} tab={tab} />;
  else if (tab === "database") workspace = <AdminDataExplorer actorUid={actorUid} />;
  else workspace = renderOverview();

  return <AccountShell mode="admin" eyebrow="SIDRA ADMIN OS" title="Platform operating system"><div className="grid gap-6"><Card elevated className="overflow-hidden p-3"><div className="flex gap-2 overflow-x-auto pb-1">{tabs.map((item) => <button type="button" key={item.id} onClick={() => { setTab(item.id); window.location.hash = item.id; }} className={`min-w-max rounded-full px-4 py-3 text-xs font-semibold transition ${tab === item.id ? "bg-[var(--color-deep-plum)] text-white" : "border border-black/10 bg-white/70 text-[var(--color-deep-plum)]"}`}>{item.label}</button>)}</div></Card>{message ? <div className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white/80 p-4 text-sm"><span>{message}</span><button type="button" onClick={() => setMessage(null)}>✕</button></div> : null}{workspace}</div>{editing ? <RecordEditor collectionName={editing.collectionName} record={editing.record} actorUid={actorUid} onClose={() => setEditing(null)} onSaved={reload} /> : null}</AccountShell>;
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createPhase12SupportTicket } from "@/services/phase12CommunicationService";
import type { Phase12SupportCategory } from "@/types/phase12-communication";

function friendlySupportError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("unauthenticated")) return "Please sign in again before sending your request.";
  if (message.includes("permission-denied")) return "Your account cannot send this request yet. Please refresh and try again.";
  if (message.includes("unavailable") || message.includes("network")) return "Support is temporarily unavailable. Please check your connection and try again.";
  if (message.includes("internal")) return "We could not send your request right now. Please try again in a moment.";
  return error instanceof Error && error.message ? error.message : "Unable to create your support request.";
}

export function CreateSupportTicketForm(): React.JSX.Element {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Phase12SupportCategory>("order");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await createPhase12SupportTicket({ subject: subject.trim(), description: description.trim(), category });
      router.push(`/account/support/${result.ticketId}`);
    } catch (caught) {
      setError(friendlySupportError(caught));
    } finally {
      setBusy(false);
    }
  }

  const field = "rounded-[1.35rem] border border-[rgba(59,30,53,.14)] bg-white px-5 py-4 text-base outline-none transition focus:border-[var(--color-dusty-rose)] focus:ring-4 focus:ring-[rgba(217,167,176,.14)]";
  return <form onSubmit={submit} className="grid gap-6 rounded-[2rem] border border-[rgba(59,30,53,.12)] bg-white/80 p-5 shadow-[0_24px_65px_rgba(59,30,53,.08)] sm:p-7">
    <div><p className="text-xs font-semibold uppercase tracking-[.22em] text-[var(--color-dusty-rose)]">Private support</p><h2 className="mt-2 font-display text-3xl text-[var(--color-deep-plum)]">How can we help?</h2></div>
    <label className="grid gap-2 text-sm font-semibold">Category<select value={category} onChange={(e)=>setCategory(e.target.value as Phase12SupportCategory)} className={field}><option value="order">Order</option><option value="customOrder">Custom order</option><option value="product">Product</option><option value="payment">Payment</option><option value="account">Account</option><option value="other">Other</option></select></label>
    <label className="grid gap-2 text-sm font-semibold">Subject<input required minLength={5} maxLength={140} value={subject} onChange={(e)=>setSubject(e.target.value)} className={field} placeholder="Briefly describe the issue" /></label>
    <label className="grid gap-2 text-sm font-semibold">Describe what happened<textarea required minLength={10} maxLength={5000} rows={7} value={description} onChange={(e)=>setDescription(e.target.value)} className={`${field} resize-y`} placeholder="Add order details, dates and anything our team should know" /></label>
    {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
    <Button type="submit" loading={busy}>Send securely</Button>
  </form>;
}

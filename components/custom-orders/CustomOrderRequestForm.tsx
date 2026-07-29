"use client";

import { useState } from "react";
import { submitCustomOrder } from "@/services/customOrderService";
import type { CustomOrderBrief } from "@/types/phase8-custom-orders";

const initialBrief: CustomOrderBrief = {
  title: "",
  description: "",
  occasion: "",
  colors: [],
  dimensions: "",
  personalizationText: "",
  referenceImageUrls: [],
  targetDeliveryDate: "",
  budgetMinPaise: null,
  budgetMaxPaise: null,
};

export function CustomOrderRequestForm({ studioId }: { readonly studioId: string }): React.JSX.Element {
  const [brief, setBrief] = useState(initialBrief);
  const [colorInput, setColorInput] = useState("");
  const [referenceInput, setReferenceInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitCustomOrder({ studioId, brief });
      setCreatedId(result.customOrderId);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Custom-order request could not be submitted.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (createdId) {
    return <div className="rounded-[var(--radius-lg)] border border-border bg-card p-8">
      <h2 className="font-heading text-3xl">Request submitted</h2>
      <p className="mt-3 leading-7 text-muted">The Studio can now review your brief and send a formal quote.</p>
      <a href={`/account/custom-orders/${createdId}`} className="mt-6 inline-flex rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white">Open request</a>
    </div>;
  }

  return <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2"><span>Project title</span><input required value={brief.title} onChange={(event) => setBrief({ ...brief, title: event.target.value })} className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" /></label>
      <label className="grid gap-2"><span>Occasion</span><input required value={brief.occasion} onChange={(event) => setBrief({ ...brief, occasion: event.target.value })} className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" /></label>
    </div>
    <label className="grid gap-2"><span>Detailed requirement</span><textarea required minLength={40} rows={6} value={brief.description} onChange={(event) => setBrief({ ...brief, description: event.target.value })} className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2"><span>Dimensions</span><input required value={brief.dimensions} onChange={(event) => setBrief({ ...brief, dimensions: event.target.value })} className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" /></label>
      <label className="grid gap-2"><span>Target delivery date</span><input required type="date" value={brief.targetDeliveryDate} onChange={(event) => setBrief({ ...brief, targetDeliveryDate: event.target.value })} className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" /></label>
    </div>
    <label className="grid gap-2"><span>Personalisation text</span><input value={brief.personalizationText} onChange={(event) => setBrief({ ...brief, personalizationText: event.target.value })} className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" /></label>
    <div className="grid gap-3">
      <label className="grid gap-2"><span>Colour palette</span><input value={colorInput} onChange={(event) => setColorInput(event.target.value)} placeholder="Gold, emerald, ivory" className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" /></label>
      <button type="button" onClick={() => setBrief({ ...brief, colors: colorInput.split(",").map((item) => item.trim()).filter(Boolean) })} className="justify-self-start rounded-[var(--radius-md)] border border-border px-4 py-2">Save colours</button>
    </div>
    <div className="grid gap-3">
      <label className="grid gap-2"><span>Reference image URLs</span><textarea rows={3} value={referenceInput} onChange={(event) => setReferenceInput(event.target.value)} placeholder="One HTTPS URL per line" className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" /></label>
      <button type="button" onClick={() => setBrief({ ...brief, referenceImageUrls: referenceInput.split("\n").map((item) => item.trim()).filter((item) => item.startsWith("https://")) })} className="justify-self-start rounded-[var(--radius-md)] border border-border px-4 py-2">Save references</button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2"><span>Budget minimum (₹)</span><input type="number" min="0" onChange={(event) => setBrief({ ...brief, budgetMinPaise: event.target.value ? Math.round(Number(event.target.value) * 100) : null })} className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" /></label>
      <label className="grid gap-2"><span>Budget maximum (₹)</span><input type="number" min="0" onChange={(event) => setBrief({ ...brief, budgetMaxPaise: event.target.value ? Math.round(Number(event.target.value) * 100) : null })} className="rounded-[var(--radius-md)] border border-border bg-card px-4 py-3" /></label>
    </div>
    <button disabled={submitting} className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-6 py-3 text-white disabled:opacity-50">{submitting ? "Submitting…" : "Submit custom request"}</button>
    {error ? <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
  </form>;
}

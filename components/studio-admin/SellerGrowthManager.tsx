"use client";
import { useState } from "react";
import { saveCustomerSegment, saveSellerCampaign, saveSellerCoupon } from "@/services/sellerGrowthService";

type Mode = "coupon" | "segment" | "campaign";
export function SellerGrowthManager({ studioId, mode, segmentOptions = [] }: { readonly studioId: string; readonly mode: Mode; readonly segmentOptions?: readonly { id: string; name: string }[] }): React.JSX.Element {
  const [name, setName] = useState("");
  const [secondary, setSecondary] = useState("");
  const [message, setMessage] = useState("");
  const [segmentId, setSegmentId] = useState(segmentOptions[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    try {
      if (mode === "coupon") {
        const result = await saveSellerCoupon({ studioId, code: name, title: secondary, discountType: "percentage", discountValue: 10, minimumOrderPaise: 0, active: true });
        setSavedId(result.couponId);
      } else if (mode === "segment") {
        const result = await saveCustomerSegment({ studioId, name, description: secondary, rule: "all" });
        setSavedId(result.segmentId);
      } else {
        const result = await saveSellerCampaign({ studioId, name, subject: secondary, message, segmentId, status: "draft" });
        setSavedId(result.campaignId);
      }
      setName(""); setSecondary(""); setMessage("");
    } finally { setBusy(false); }
  };

  return <section className="grid gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-6">
    <h2 className="font-heading text-3xl">{mode === "coupon" ? "Create coupon" : mode === "segment" ? "Create customer segment" : "Create campaign draft"}</h2>
    <label className="grid gap-2"><span>{mode === "coupon" ? "Coupon code" : "Name"}</span><input value={name} onChange={(e) => setName(e.target.value)} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
    <label className="grid gap-2"><span>{mode === "campaign" ? "Subject" : mode === "coupon" ? "Title" : "Description"}</span><input value={secondary} onChange={(e) => setSecondary(e.target.value)} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
    {mode === "campaign" ? <><label className="grid gap-2"><span>Audience</span><select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3">{segmentOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="grid gap-2"><span>Message</span><textarea rows={7} value={message} onChange={(e) => setMessage(e.target.value)} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label></> : null}
    <button disabled={busy || name.trim().length < 3 || secondary.trim().length < 3 || (mode === "campaign" && (!segmentId || message.trim().length < 10))} onClick={() => void save()} className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
    {savedId ? <p className="text-sm text-muted">Saved successfully: {savedId}</p> : null}
  </section>;
}

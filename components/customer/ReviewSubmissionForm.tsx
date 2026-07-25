"use client";

import { useState } from "react";
import { submitProductReview } from "@/services/customerEngagementService";

export function ReviewSubmissionForm({
  orderId,
  productId,
}: {
  readonly orderId: string;
  readonly productId: string;
}): React.JSX.Element {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState("");
  const [busy, setBusy] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    try {
      const result = await submitProductReview({
        orderId,
        productId,
        rating,
        title,
        body,
        imageUrls: images.split("\n").map((item) => item.trim()).filter((item) => item.startsWith("https://")),
      });
      setReviewId(result.reviewId);
    } finally {
      setBusy(false);
    }
  };

  if (reviewId) {
    return <div className="rounded-[var(--radius-lg)] border border-border bg-card p-8">
      <h2 className="font-heading text-3xl">Review submitted</h2>
      <p className="mt-3 leading-7 text-muted">Your verified-purchase review is waiting for moderation.</p>
    </div>;
  }

  return <section className="grid gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-6">
    <h2 className="font-heading text-3xl">Write a verified review</h2>
    <label className="grid gap-2"><span>Rating</span><select value={rating} onChange={(event) => setRating(Number(event.target.value) as 1 | 2 | 3 | 4 | 5)} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3">{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select></label>
    <label className="grid gap-2"><span>Title</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
    <label className="grid gap-2"><span>Review</span><textarea rows={6} value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
    <label className="grid gap-2"><span>Image URLs</span><textarea rows={3} value={images} onChange={(event) => setImages(event.target.value)} placeholder="One HTTPS URL per line" className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></label>
    <button disabled={busy || title.trim().length < 3 || body.trim().length < 20} onClick={() => void submit()} className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50">{busy ? "Submitting…" : "Submit review"}</button>
  </section>;
}

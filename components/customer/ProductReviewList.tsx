import type { ProductReview } from "@/types/phase9-customer";

export function ProductReviewList({ reviews }: { readonly reviews: readonly ProductReview[] }): React.JSX.Element {
  if (reviews.length === 0) return <p className="text-muted">No published reviews yet.</p>;
  return <div className="grid gap-5">
    {reviews.map((review) => <article key={review.reviewId} className="rounded-[var(--radius-lg)] border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-medium">{review.customerName}</p><p className="mt-1 text-xs text-muted">Verified purchase</p></div>
        <p>{review.rating}/5</p>
      </div>
      <h3 className="mt-5 font-heading text-2xl">{review.title}</h3>
      <p className="mt-3 leading-7">{review.body}</p>
      {review.sellerResponse ? <div className="mt-5 rounded-[var(--radius-md)] border border-border bg-background p-4"><p className="text-xs uppercase tracking-[0.16em] text-muted">Studio response</p><p className="mt-2 leading-7">{review.sellerResponse}</p></div> : null}
    </article>)}
  </div>;
}

"use client";

import { CardFramePreview } from "@/components/canvas-engine/CardFramePreview";

export function LiveFramePreview({
  categorySlug,
  imageUrl,
}: {
  readonly categorySlug: string;
  readonly imageUrl: string | null;
}): React.JSX.Element {
  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Canvas Engine Preview</p>
      <h3 className="mt-2 font-heading text-2xl text-foreground">Published card framing</h3>
      <p className="mt-2 text-sm leading-6 text-muted">The same shared Canvas Engine renderer is used during publishing.</p>
      <div className="mt-5">
        <CardFramePreview categorySlug={categorySlug || "default"} imageUrl={imageUrl ?? ""} />
      </div>
    </section>
  );
}

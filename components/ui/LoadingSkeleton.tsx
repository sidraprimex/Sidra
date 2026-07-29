export function LoadingSkeleton({ count=3 }: { count?: number }) {
  return <div className="grid gap-5" role="status" aria-label="Loading content">
    <div className="flex items-center justify-center gap-4 py-3">
      <span className="relative grid h-11 w-11 shrink-0 place-items-center">
        <span className="absolute inset-0 animate-spin rounded-full border border-[rgba(59,30,53,.12)] border-t-[var(--color-dusty-rose)]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-deep-plum)]" />
      </span>
      <span className="text-xs font-semibold uppercase tracking-[.18em] text-black/45">Preparing your view</span>
    </div>
    {Array.from({ length: count }).map((_, i)=><div key={i} className="h-24 animate-pulse rounded-[1.35rem] border border-black/[.04] bg-[linear-gradient(110deg,rgba(255,255,255,.65),rgba(217,167,176,.12),rgba(255,255,255,.65))] bg-[length:200%_100%]" />)}
    <span className="sr-only">Loading</span>
  </div>;
}

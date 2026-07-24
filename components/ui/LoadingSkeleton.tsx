export function LoadingSkeleton({ count=3 }: { count?: number }) {
  return <div className="grid gap-4" role="status" aria-label="Loading content">{Array.from({ length: count }).map((_, i)=><div key={i} className="h-24 animate-pulse rounded-md bg-gray-100" />)}<span className="sr-only">Loading</span></div>;
}

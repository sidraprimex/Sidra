interface PremiumLoaderProps {
  readonly label?: string;
  readonly fullPage?: boolean;
}

export function PremiumLoader({
  label = "Preparing your Sidra experience",
  fullPage = false,
}: PremiumLoaderProps): React.JSX.Element {
  return (
    <div
      className={`grid place-items-center ${
        fullPage ? "min-h-[70vh]" : "min-h-56"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="grid justify-items-center gap-5 text-center">
        <span className="relative grid h-16 w-16 place-items-center">
          <span className="absolute inset-0 animate-spin rounded-full border border-[rgba(59,30,53,.12)] border-t-[var(--color-dusty-rose)]" />
          <span className="absolute inset-2 animate-[spin_1.8s_linear_infinite_reverse] rounded-full border border-[rgba(217,167,176,.2)] border-b-[var(--color-deep-plum)]" />
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--color-dusty-rose)] shadow-[0_0_22px_rgba(217,167,176,.8)]" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-black/55">
          {label}
        </p>
      </div>
    </div>
  );
}

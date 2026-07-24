export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-4" aria-hidden="true">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-micro uppercase tracking-[0.24em] text-gray-300">
        or
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

const AUTH_ROUTES = new Set(["/login", "/register", "/verify-email"]);

export function safeInternalDestination(
  value: string | null | undefined,
  fallback = "/account/dashboard",
): string {
  const candidate = value?.trim() ?? "";
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return fallback;
  }
  try {
    const parsed = new URL(candidate, "https://sidra.local");
    if (parsed.origin !== "https://sidra.local" || AUTH_ROUTES.has(parsed.pathname)) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

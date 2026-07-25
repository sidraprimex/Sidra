export const SUPPORT_CATEGORIES = ["order", "customOrder", "product", "payment", "account", "other"] as const;
export const SUPPORT_STATUSES = ["open", "assigned", "inProgress", "waitingOnCustomer", "resolved", "closed"] as const;

export function cleanText(value: unknown, max: number): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

export function isSupportCategory(value: string): boolean {
  return (SUPPORT_CATEGORIES as readonly string[]).includes(value);
}

export function isSupportStatus(value: string): boolean {
  return (SUPPORT_STATUSES as readonly string[]).includes(value);
}

export function canTransitionSupportStatus(from: string, to: string): boolean {
  const transitions: Record<string, readonly string[]> = {
    open: ["assigned", "inProgress", "resolved", "closed"],
    assigned: ["inProgress", "waitingOnCustomer", "resolved", "closed"],
    inProgress: ["waitingOnCustomer", "resolved", "closed"],
    waitingOnCustomer: ["inProgress", "resolved", "closed"],
    resolved: ["inProgress", "closed"],
    closed: [],
  };
  return Boolean(transitions[from]?.includes(to));
}

import type { SecuritySignalType } from "@/types/phase13-launch-readiness";

export const SECURITY_SIGNAL_THRESHOLDS = Object.freeze({
  failedLoginBurst: { count: 5, windowMinutes: 15 },
  rapidAccountCreation: { count: 4, windowMinutes: 60 },
  excessiveRefunds: { count: 3, windowDays: 30 },
  duplicateSellerApplication: { count: 2, windowDays: 90 },
});

export function isSecuritySignalType(value: unknown): value is SecuritySignalType {
  return ["failedLoginBurst", "rapidAccountCreation", "excessiveRefunds", "duplicateSellerApplication"].includes(String(value));
}

export function shouldRaiseSignal(type: SecuritySignalType, count: number): boolean {
  return count >= SECURITY_SIGNAL_THRESHOLDS[type].count;
}

export function assertNoAutomaticSuspension(action: string): boolean {
  return !["suspendUser", "disableAccount", "suspendStudio", "blockCheckout"].includes(action);
}

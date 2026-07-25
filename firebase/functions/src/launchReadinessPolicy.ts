export const RELEASE_GATES = ["authFlows", "securityRules", "customerJourney", "sellerProvisioning", "webhookForgery", "performanceBudgets", "bugGate", "recentBackup", "rbacMatrix", "loadTest"] as const;
export type ReleaseGateKey = (typeof RELEASE_GATES)[number];
export const RELEASE_STATUSES = ["notRun", "running", "passed", "failed", "blocked"] as const;
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];
export const SECURITY_STATUSES = ["open", "reviewing", "dismissed", "confirmed"] as const;

export function isReleaseGate(value: unknown): value is ReleaseGateKey { return RELEASE_GATES.includes(String(value) as ReleaseGateKey); }
export function isReleaseStatus(value: unknown): value is ReleaseStatus { return RELEASE_STATUSES.includes(String(value) as ReleaseStatus); }
export function isSecurityStatus(value: unknown): value is (typeof SECURITY_STATUSES)[number] { return SECURITY_STATUSES.includes(String(value) as (typeof SECURITY_STATUSES)[number]); }
export function cleanEvidenceText(value: unknown, max: number): string { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
export function releaseIsReady(statuses: readonly string[], openSignals: number, criticalBugs: number): boolean { return statuses.length === RELEASE_GATES.length && statuses.every((value) => value === "passed") && openSignals === 0 && criticalBugs === 0; }

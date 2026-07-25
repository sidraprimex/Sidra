export function isFounderRole(role: unknown): role is "founder" {
  return role === "founder";
}
export function isValidPercentage(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}
export function isValidPaiseAmount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}
export function normalizeContentKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}
export function calculateSellerPayable(grossPaise: number, platformFeePercent: number, commissionPaise = 0, refundPaise = 0): number {
  return Math.max(0, grossPaise - Math.round(grossPaise * platformFeePercent / 100) - commissionPaise - refundPaise);
}
export function calculatePlatformRevenue(grossPaise: number, platformFeePercent: number, commissionPaise = 0): number {
  return Math.max(0, Math.round(grossPaise * platformFeePercent / 100) + commissionPaise);
}

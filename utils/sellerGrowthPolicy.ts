export function normalizeCouponCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, "").slice(0, 24);
}
export function isValidPercentageDiscount(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= 90;
}
export function calculateCouponDiscount(subtotalPaise: number, type: "percentage" | "fixed", value: number): number {
  const raw = type === "percentage" ? Math.round(subtotalPaise * value / 100) : value;
  return Math.max(0, Math.min(subtotalPaise, raw));
}
export function calculateConversionRate(orderCount: number, visitorCount: number): number {
  return visitorCount <= 0 ? 0 : Math.round((orderCount / visitorCount) * 10000) / 100;
}

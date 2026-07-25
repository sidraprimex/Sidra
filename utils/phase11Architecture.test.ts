import { describe, expect, it } from "vitest";
import { calculateConversionRate, calculateCouponDiscount, isValidPercentageDiscount, normalizeCouponCode } from "@/utils/sellerGrowthPolicy";
describe("Phase 11 architecture", () => {
  it("normalizes codes", () => expect(normalizeCouponCode(" sidra 10 ")).toBe("SIDRA10"));
  it("calculates discount", () => expect(calculateCouponDiscount(100000,"percentage",20)).toBe(20000));
  it("calculates conversion", () => expect(calculateConversionRate(25,1000)).toBe(2.5));
  it("rejects excessive discounts", () => expect(isValidPercentageDiscount(91)).toBe(false));
});

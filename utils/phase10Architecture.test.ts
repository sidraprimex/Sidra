import { describe, expect, it } from "vitest";
import { calculatePlatformRevenue, calculateSellerPayable, isFounderRole, isValidPaiseAmount, isValidPercentage, normalizeContentKey } from "@/utils/adminControlPolicy";
describe("Phase 10 founder admin", () => {
  it("validates role", () => { expect(isFounderRole("founder")).toBe(true); expect(isFounderRole("seller")).toBe(false); });
  it("calculates shares in paise", () => { expect(calculatePlatformRevenue(100000,10,5000)).toBe(15000); expect(calculateSellerPayable(100000,10,5000)).toBe(85000); });
  it("validates values", () => { expect(isValidPercentage(100)).toBe(true); expect(isValidPercentage(101)).toBe(false); expect(isValidPaiseAmount(100)).toBe(true); });
  it("normalizes CMS keys", () => expect(normalizeContentKey("Homepage Hero Title")).toBe("homepage-hero-title"));
});

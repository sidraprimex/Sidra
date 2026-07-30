import { describe, expect, it } from "vitest";
import {
  calculateProfitCommission,
  commissionRateForPlan,
} from "@/utils/subscriptionCommission";

describe("seller subscription commission", () => {
  it("applies commission to profit, not the buyer total", () => {
    const result = calculateProfitCommission({
      sellingSubtotalPaise: 1_000_000,
      sellerCostPaise: 600_000,
      plan: "free",
    });
    expect(result.profitPaise).toBe(400_000);
    expect(result.commissionPaise).toBe(48_000);
    expect(result.sellerProfitAfterCommissionPaise).toBe(352_000);
  });

  it("enforces each plan maximum", () => {
    expect(commissionRateForPlan("free", 1500)).toBe(1200);
    expect(commissionRateForPlan("starter", 1500)).toBe(1000);
    expect(commissionRateForPlan("growth", 1500)).toBe(400);
    expect(commissionRateForPlan("luxury", 1500)).toBe(100);
  });

  it("allows admin rates below the plan maximum", () => {
    expect(commissionRateForPlan("free", 500)).toBe(500);
    expect(commissionRateForPlan("starter", 250)).toBe(250);
    expect(commissionRateForPlan("growth", 0)).toBe(0);
  });
});

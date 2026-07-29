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
      plan: "commission",
    });
    expect(result.profitPaise).toBe(400_000);
    expect(result.commissionPaise).toBe(48_000);
    expect(result.sellerProfitAfterCommissionPaise).toBe(352_000);
  });

  it("enforces each plan maximum", () => {
    expect(commissionRateForPlan("commission", 1500)).toBe(1200);
    expect(commissionRateForPlan("monthly500", 1500)).toBe(1000);
    expect(commissionRateForPlan("monthly2000", 1500)).toBe(200);
  });

  it("allows admin rates below the plan maximum", () => {
    expect(commissionRateForPlan("commission", 500)).toBe(500);
    expect(commissionRateForPlan("monthly500", 250)).toBe(250);
    expect(commissionRateForPlan("monthly2000", 0)).toBe(0);
  });
});

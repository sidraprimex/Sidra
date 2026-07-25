import { describe, expect, it } from "vitest";
import { calculateCommissionPaise } from "./commissionEngine";
import { isLegalTransition } from "./orderStateMachine";

describe("Phase 7 order lifecycle", () => {
  it("rejects placed directly to delivered", () => {
    expect(isLegalTransition("placed", "delivered", "seller")).toBe(false);
  });

  it("allows the legal seller production sequence", () => {
    expect(isLegalTransition("placed", "accepted", "seller")).toBe(true);
    expect(isLegalTransition("accepted", "inProduction", "seller")).toBe(true);
  });

  it("changes commission without code changes", () => {
    expect(calculateCommissionPaise(100_000, { mode: "percentage", percentageBasisPoints: 1000 }, "art", "starter")).toBe(10_000);
    expect(calculateCommissionPaise(100_000, { mode: "percentage", percentageBasisPoints: 1500 }, "art", "starter")).toBe(15_000);
  });
});

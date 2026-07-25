import { describe, expect, it } from "vitest";
import { isLegalCustomOrderTransition } from "./customOrderStateMachine";

describe("Phase 8 custom-order lifecycle", () => {
  it("rejects unpaid production", () => {
    expect(isLegalCustomOrderTransition("quoteSent", "inProduction", "seller")).toBe(false);
  });

  it("allows seller production only after payment", () => {
    expect(isLegalCustomOrderTransition("paid", "inProduction", "seller")).toBe(true);
  });

  it("allows customer proof approval and revision request", () => {
    expect(isLegalCustomOrderTransition("proofReady", "approved", "customer")).toBe(true);
    expect(isLegalCustomOrderTransition("proofReady", "revisionRequested", "customer")).toBe(true);
  });
});

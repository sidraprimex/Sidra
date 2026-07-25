import { describe, expect, it } from "vitest";
import {
  canCustomerPayCustomOrder,
  canSellerSendQuote,
  canSubmitProof,
  isCustomOrderTransitionAllowed,
} from "@/utils/customOrderLifecycle";

describe("Phase 8 custom-order rules", () => {
  it("never permits payment before a quote is accepted", () => {
    expect(canCustomerPayCustomOrder("submitted")).toBe(false);
    expect(canCustomerPayCustomOrder("quoteAccepted")).toBe(true);
  });

  it("limits quote creation to review states", () => {
    expect(canSellerSendQuote("sellerReview")).toBe(true);
    expect(canSellerSendQuote("paid")).toBe(false);
  });

  it("limits proofs to active production or revision", () => {
    expect(canSubmitProof("inProduction")).toBe(true);
    expect(canSubmitProof("revisionRequested")).toBe(true);
    expect(canSubmitProof("quoteSent")).toBe(false);
  });

  it("rejects seller self-approval of proof", () => {
    expect(isCustomOrderTransitionAllowed("proofReady", "approved", "seller")).toBe(false);
  });
});

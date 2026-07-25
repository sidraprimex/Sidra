import { describe, expect, it } from "vitest";
import { canShowReviewCta, customerTrackingStages, toCustomerTrackingStage } from "@/utils/orderLifecycle";

describe("Phase 7 customer-safe order presentation", () => {
  it("never exposes internal production states as tracking stages", () => {
    expect(toCustomerTrackingStage("qualityCheck")).toBe("placed");
    expect(customerTrackingStages).toEqual(["placed", "shipped", "inTransit", "outForDelivery", "delivered"]);
  });

  it("shows review CTA only after delivery", () => {
    expect(canShowReviewCta("inTransit")).toBe(false);
    expect(canShowReviewCta("delivered")).toBe(true);
    expect(canShowReviewCta("completed")).toBe(true);
  });
});

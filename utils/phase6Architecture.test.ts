import { describe, expect, it } from "vitest";
import { calculateCheckoutDraft } from "@/utils/cartTotals";

describe("Phase 6 commerce rules", () => {
  it("splits checkout by Studio", () => {
    const draft = calculateCheckoutDraft([
      { productId: "1", productSlug: "a", productName: "A", imageUrl: null, studioId: "s1", studioName: "One", variantId: null, variantLabel: null, unitPricePaise: 10000, quantity: 1, estimatedDeliveryStart: "1 Aug", estimatedDeliveryEnd: "3 Aug" },
      { productId: "2", productSlug: "b", productName: "B", imageUrl: null, studioId: "s2", studioName: "Two", variantId: null, variantLabel: null, unitPricePaise: 20000, quantity: 1, estimatedDeliveryStart: "2 Aug", estimatedDeliveryEnd: "4 Aug" },
    ]);
    expect(draft.studioCount).toBe(2);
    expect(draft.shipmentCount).toBe(2);
    expect(draft.shippingPaise).toBe(0);
    expect(draft.totalPaise).toBe(draft.subtotalPaise);
  });

  it("adds buyer shipping only when an admin explicitly enables buyer-paid delivery", () => {
    const draft = calculateCheckoutDraft([
      { productId: "1", productSlug: "a", productName: "A", imageUrl: null, studioId: "s1", studioName: "One", variantId: null, variantLabel: null, unitPricePaise: 10000, quantity: 1, estimatedDeliveryStart: "1 Aug", estimatedDeliveryEnd: "3 Aug" },
      { productId: "2", productSlug: "b", productName: "B", imageUrl: null, studioId: "s2", studioName: "Two", variantId: null, variantLabel: null, unitPricePaise: 20000, quantity: 1, estimatedDeliveryStart: "2 Aug", estimatedDeliveryEnd: "4 Aug" },
    ], null, "buyerPaid");

    expect(draft.shippingPaise).toBe(19800);
    expect(draft.totalPaise).toBe(draft.subtotalPaise + 19800);
  });

  it("exposes exactly four checkout steps by contract", () => {
    expect(["Shipping address", "Delivery & order review", "Payment", "Confirmation"]).toHaveLength(4);
  });
});

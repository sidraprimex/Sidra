import { describe, expect, it } from "vitest";
import {
  canRestoreCheckoutState,
  checkoutCartFingerprint,
} from "@/utils/checkoutContinuity";

const item = {
  productId: "product-a",
  productSlug: "product-a",
  productName: "Product A",
  imageUrl: null,
  studioId: "studio-a",
  studioName: "Studio A",
  variantId: null,
  variantLabel: null,
  unitPricePaise: 129900,
  quantity: 1,
  estimatedDeliveryStart: "2026-08-10",
  estimatedDeliveryEnd: "2026-08-15",
} as const;

describe("checkout continuity", () => {
  it("changes identity when product, quantity or price changes", () => {
    const original = checkoutCartFingerprint([item]);
    expect(checkoutCartFingerprint([{ ...item, quantity: 2 }])).not.toBe(original);
    expect(checkoutCartFingerprint([{ ...item, productId: "product-b" }])).not.toBe(original);
    expect(checkoutCartFingerprint([{ ...item, unitPricePaise: 99900 }])).not.toBe(original);
  });

  it("restores only the checkout created for the current cart", () => {
    const fingerprint = checkoutCartFingerprint([item]);
    expect(canRestoreCheckoutState({ cartFingerprint: fingerprint, step: 3 }, fingerprint)).toBe(true);
    expect(canRestoreCheckoutState({ cartFingerprint: "old-cart", step: 3 }, fingerprint)).toBe(false);
    expect(canRestoreCheckoutState(null, fingerprint)).toBe(false);
  });
});

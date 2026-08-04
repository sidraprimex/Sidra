import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Sidra master repair contracts", () => {
  it("recalculates gateway totals from Firestore products", () => {
    const initiate = readFileSync("firebase/functions/src/initiatePayment.ts", "utf8");
    const resolver = readFileSync("firebase/functions/src/secureCheckout.ts", "utf8");
    expect(initiate).toContain("resolveSecureCheckout");
    expect(initiate).not.toContain("Number(checkout.totalPaise)");
    expect(resolver).toContain('collection("products")');
  });

  it("creates seller-scoped paid orders and notifications", () => {
    const webhook = readFileSync("firebase/functions/src/paymentWebhook.ts", "utf8");
    expect(webhook).toContain('orderStatus:"placed"');
    expect(webhook).toContain('type:"newOrder"');
    expect(webhook).toContain("groupByStudio");
  });

  it("subscribes to one order instead of the full collection", () => {
    const lifecycle = readFileSync("services/orderLifecycleService.ts", "utf8");
    expect(lifecycle).toContain('onSnapshot(doc(db, "orders", orderId)');
    expect(lifecycle).not.toContain('onSnapshot(collection(db, "orders")');
  });
});

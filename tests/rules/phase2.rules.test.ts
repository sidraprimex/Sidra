import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { readFile } from "node:fs/promises";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;
const projectId = "sidra-phase2-rules-test";
const run = process.env.FIRESTORE_EMULATOR_HOST ? describe : describe.skip;

run("Phase 2 Firestore security boundaries", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: { rules: await readFile("../../firebase/rules/firestore.rules", "utf8") },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "products/product-a"), {
        productId: "product-a",
        studioId: "studio-a",
        status: "draft",
        name: "Private draft",
        createdAt: null,
        updatedAt: null,
      });
      await setDoc(doc(db, "orders/order-1"), {
        orderId: "order-1",
        customerId: "customer-1",
        studioId: "studio-a",
        orderStatus: "placed",
        paymentStatus: "paid",
        timeline: [],
        lineItems: [{ productId: "product-a", qty: 1 }],
        createdAt: null,
        updatedAt: null,
      });
      await setDoc(doc(db, "auditLogs/log-1"), {
        logId: "log-1",
        actorUid: "founder-1",
        action: "seed",
        targetType: "order",
        targetId: "order-1",
        previousValue: null,
        newValue: {},
        timestamp: null,
      });
    });
  });

  afterAll(async () => testEnv.cleanup());

  it("denies cross-studio access to a seller draft product", async () => {
    const ownDb = testEnv.authenticatedContext("seller-a", {
      role: "seller",
      studioId: "studio-a",
      email_verified: true,
    }).firestore();
    const otherDb = testEnv.authenticatedContext("seller-b", {
      role: "seller",
      studioId: "studio-b",
      email_verified: true,
    }).firestore();

    await assertSucceeds(getDoc(doc(ownDb, "products/product-a")));
    await assertFails(getDoc(doc(otherDb, "products/product-a")));
    await assertFails(updateDoc(doc(otherDb, "products/product-a"), { name: "Tampered" }));
  });

  it("denies every direct customer order-status write", async () => {
    const customerDb = testEnv.authenticatedContext("customer-1", {
      role: "customer",
      email_verified: true,
    }).firestore();
    await assertSucceeds(getDoc(doc(customerDb, "orders/order-1")));
    await assertFails(updateDoc(doc(customerDb, "orders/order-1"), { orderStatus: "completed" }));
  });

  it("denies direct review creation including verifiedPurchase spoofing", async () => {
    const customerDb = testEnv.authenticatedContext("customer-1", {
      role: "customer",
      email_verified: true,
    }).firestore();
    await assertFails(setDoc(doc(customerDb, "reviews/review-1"), {
      reviewId: "review-1",
      customerId: "customer-1",
      studioId: "studio-a",
      productId: "product-a",
      orderId: "order-1",
      rating: 5,
      title: "Excellent",
      body: "A verified-looking client write must still fail.",
      imageUrls: [],
      verifiedPurchase: true,
      moderationStatus: "visible",
      createdAt: null,
      editableUntil: null,
    }));
  });

  it("keeps audit logs immutable even for Founder claims", async () => {
    const founderDb = testEnv.authenticatedContext("founder-1", {
      role: "founder",
      email_verified: true,
    }).firestore();
    await assertSucceeds(getDoc(doc(founderDb, "auditLogs/log-1")));
    await assertFails(updateDoc(doc(founderDb, "auditLogs/log-1"), { action: "rewritten" }));
    await assertFails(deleteDoc(doc(founderDb, "auditLogs/log-1")));
  });

  it("denies a seller from reading an order belonging to another studio", async () => {
    const otherDb = testEnv.authenticatedContext("seller-b", {
      role: "seller",
      studioId: "studio-b",
      email_verified: true,
    }).firestore();
    await assertFails(getDoc(doc(otherDb, "orders/order-1")));
  });
});

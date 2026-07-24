import { afterAll, beforeAll, describe, it } from "vitest";
import { readFile } from "node:fs/promises";
import { initializeTestEnvironment, assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;
const projectId = "sidra-rules-test";
const run = process.env.FIRESTORE_EMULATOR_HOST ? describe : describe.skip;

run("users Firestore rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({ projectId, firestore: { rules: await readFile("../../firebase/rules/firestore.rules", "utf8") } });
  });
  afterAll(async () => { await testEnv.cleanup(); });

  it("allows a customer to create only their safe default profile", async () => {
    const db = testEnv.authenticatedContext("customer-1", { email: "collector@example.com", email_verified: false, role: "customer" }).firestore();
    await assertSucceeds(setDoc(doc(db, "users/customer-1"), {
      uid: "customer-1", email: "collector@example.com", fullName: "Collector", phone: null,
      role: "customer", studioId: null, profilePhoto: null, status: "active", emailVerified: false,
      preferredLanguage: "en", notificationPreferences: {}, wishlistCount: 0, orderCount: 0,
      loyaltyPoints: 0, createdAt: null, updatedAt: null, lastLoginAt: null,
    }));
  });

  it("denies customer self-promotion to founder", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "users/customer-2"), { uid: "customer-2", email: "c@example.com", role: "customer", studioId: null, status: "active", wishlistCount: 0, orderCount: 0, loyaltyPoints: 0 });
    });
    const db = testEnv.authenticatedContext("customer-2", { email: "c@example.com", email_verified: true, role: "customer" }).firestore();
    await assertFails(updateDoc(doc(db, "users/customer-2"), { role: "founder" }));
  });

  it("blocks another customer from reading a private profile", async () => {
    const db = testEnv.authenticatedContext("customer-3", { role: "customer" }).firestore();
    await assertFails(getDoc(doc(db, "users/customer-2")));
  });
});

import { afterAll, beforeAll, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

let environment: RulesTestEnvironment;

function applicationPayload(uid: string, email: string) {
  return {
    uid,
    fullName: "Artist Name",
    studioName: "Artist Studio",
    email,
    mobile: "9999999999",
    city: "Kalaburagi",
    state: "Karnataka",
    portfolioImages: [{
      path: `temp/${uid}/seller-applications/a.jpg`,
      downloadUrl: "https://example.com/a.jpg",
      fileName: "a.jpg",
      contentType: "image/jpeg",
      size: 100,
    }],
    instagram: null,
    experience: "More than twenty characters of experience.",
    productCategories: ["Resin"],
    whyJoin: "More than twenty characters explaining the reason.",
    expectedMonthlyCapacity: 10,
    status: "pending",
    reviewNote: null,
    reviewedBy: null,
    studioId: null,
    slug: null,
    failureReason: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewedAt: null,
    provisionedAt: null,
  };
}

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: "sidra-phase3-rules",
    firestore: {
      rules: readFileSync("firebase/rules/firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => environment.cleanup());

describe("Phase 3 seller onboarding rules", () => {
  it("allows a verified customer to create only their own pending application", async () => {
    const customer = environment.authenticatedContext("customer-1", {
      role: "customer",
      email_verified: true,
      email: "artist@example.com",
    }).firestore();

    await assertSucceeds(setDoc(
      doc(customer, "sellerApplications/app-1"),
      applicationPayload("customer-1", "artist@example.com"),
    ));
  });

  it("denies unverified, cross-account and invalid portfolio submissions", async () => {
    const unverified = environment.authenticatedContext("customer-2", {
      role: "customer",
      email_verified: false,
      email: "artist@example.com",
    }).firestore();
    const verified = environment.authenticatedContext("customer-3", {
      role: "customer",
      email_verified: true,
      email: "artist@example.com",
    }).firestore();

    await assertFails(setDoc(
      doc(unverified, "sellerApplications/unverified"),
      applicationPayload("customer-2", "artist@example.com"),
    ));
    await assertFails(setDoc(
      doc(verified, "sellerApplications/cross-account"),
      applicationPayload("another-customer", "artist@example.com"),
    ));
    await assertFails(setDoc(
      doc(verified, "sellerApplications/invalid-path"),
      {
        ...applicationPayload("customer-3", "artist@example.com"),
        portfolioImages: [{
          path: "temp/another-customer/seller-applications/a.jpg",
          downloadUrl: "https://example.com/a.jpg",
          fileName: "a.jpg",
          contentType: "image/jpeg",
          size: 100,
        }],
      },
    ));
  });

  it("denies direct application decisions, seller slug changes and product hard deletion", async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "sellerApplications/app-2"), {
        uid: "customer-2",
        status: "pending",
      });
      await setDoc(doc(db, "studios/studio-1"), {
        studioId: "studio-1",
        ownerUid: "seller-1",
        name: "Permanent Studio",
        slug: "permanent-slug",
        active: true,
        provisioningState: "complete",
      });
      await setDoc(doc(db, "products/product-1"), {
        productId: "product-1",
        studioId: "studio-1",
        status: "active",
      });
    });

    const founder = environment.authenticatedContext("founder-1", {
      role: "founder",
    }).firestore();
    const seller = environment.authenticatedContext("seller-1", {
      role: "seller",
      studioId: "studio-1",
    }).firestore();

    await assertFails(updateDoc(
      doc(founder, "sellerApplications/app-2"),
      { status: "approved" },
    ));
    await assertFails(updateDoc(
      doc(seller, "studios/studio-1"),
      { slug: "changed" },
    ));
    await assertFails(deleteDoc(doc(seller, "products/product-1")));
    await assertSucceeds(getDoc(doc(founder, "sellerApplications/app-2")));
  });
});

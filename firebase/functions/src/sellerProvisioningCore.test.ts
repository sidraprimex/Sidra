import test from "node:test";
import assert from "node:assert/strict";
import {
  CANONICAL_PROVISIONING_STEPS,
  executeSellerProvisioning,
  ProvisioningAlreadyHandledError,
  shouldStartProvisioning,
  type ProvisioningContext,
  type ProvisioningDependencies,
  type ProvisioningStep,
} from "./sellerProvisioningCore";

const context: ProvisioningContext = {
  applicationId: "app-1",
  uid: "seller-1",
  approvingAdminUid: "founder-1",
  fullName: "Artist Name",
  studioName: "Atelier",
  email: "artist@example.com",
  portfolioPaths: [],
};

function createDependencies(executor: (step: ProvisioningStep) => Promise<void>): ProvisioningDependencies {
  const dependencies = Object.fromEntries(
    CANONICAL_PROVISIONING_STEPS.map((step) => [step, () => executor(step)]),
  ) as unknown as ProvisioningDependencies;
  dependencies.compensate = async () => undefined;
  dependencies.writeFailureAudit = async () => undefined;
  dependencies.alertFounder = async () => undefined;
  return dependencies;
}

test("successful provisioning executes the canonical nine steps in literal order", async () => {
  const executed: ProvisioningStep[] = [];
  const dependencies = createDependencies(async (step) => { executed.push(step); });
  const result = await executeSellerProvisioning(context, dependencies);
  assert.equal(result.studioId, context.applicationId);
  assert.deepEqual(executed, CANONICAL_PROVISIONING_STEPS);
});

test("step seven failure rolls back completed steps one through six and alerts Founder", async () => {
  const executed: ProvisioningStep[] = [];
  const compensated: ProvisioningStep[] = [];
  let failureAudit = false;
  let founderAlert = false;
  const dependencies = createDependencies(async (step) => {
    if (step === "sendWelcomeEmail") throw new Error("forced email failure");
    executed.push(step);
  });
  dependencies.compensate = async (step) => { compensated.push(step); };
  dependencies.writeFailureAudit = async () => { failureAudit = true; };
  dependencies.alertFounder = async () => { founderAlert = true; };
  await assert.rejects(() => executeSellerProvisioning(context, dependencies), /forced email failure/);
  assert.deepEqual(executed, CANONICAL_PROVISIONING_STEPS.slice(0, 6));
  assert.deepEqual(compensated, [...CANONICAL_PROVISIONING_STEPS.slice(0, 7)].reverse());
  assert.equal(failureAudit, true);
  assert.equal(founderAlert, true);
});

test("only a new approved transition starts provisioning", () => {
  assert.equal(shouldStartProvisioning("pending", "approved"), true);
  assert.equal(shouldStartProvisioning("moreInfoRequested", "approved"), true);
  assert.equal(shouldStartProvisioning("approved", "approved"), false);
  assert.equal(shouldStartProvisioning("pending", "rejected"), false);
  assert.equal(shouldStartProvisioning("pending", "onHold"), false);
  assert.equal(shouldStartProvisioning("pending", "moreInfoRequested"), false);
});

test("an already-handled duplicate trigger exits without compensation or failure reporting", async () => {
  let compensated = false;
  let failureAudit = false;
  let founderAlert = false;
  const dependencies = createDependencies(async (step) => {
    if (step === "createStudio") throw new ProvisioningAlreadyHandledError();
  });
  dependencies.compensate = async () => { compensated = true; };
  dependencies.writeFailureAudit = async () => { failureAudit = true; };
  dependencies.alertFounder = async () => { founderAlert = true; };

  await assert.rejects(
    () => executeSellerProvisioning(context, dependencies),
    { name: "ProvisioningAlreadyHandledError" },
  );
  assert.equal(compensated, false);
  assert.equal(failureAudit, false);
  assert.equal(founderAlert, false);
});

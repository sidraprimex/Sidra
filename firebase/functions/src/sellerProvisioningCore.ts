export const CANONICAL_PROVISIONING_STEPS = [
  "createStudio", "reserveSlug", "createStorageTree", "initializeAnalytics", "createSeoMetadata",
  "assignSellerRole", "sendWelcomeEmail", "sendSellerNotification", "writeApprovalAudit",
] as const;
export type ProvisioningStep = (typeof CANONICAL_PROVISIONING_STEPS)[number];
export class ProvisioningAlreadyHandledError extends Error {
  constructor() {
    super("Seller application provisioning is already in progress or complete.");
    this.name = "ProvisioningAlreadyHandledError";
  }
}
export interface ProvisioningContext { applicationId: string; uid: string; approvingAdminUid: string; fullName: string; studioName: string; email: string; portfolioPaths: string[]; }
export interface ProvisioningState { studioId: string; slug?: string; }
export interface ProvisioningDependencies {
  createStudio(context: ProvisioningContext, state: ProvisioningState): Promise<void>;
  reserveSlug(context: ProvisioningContext, state: ProvisioningState): Promise<void>;
  createStorageTree(context: ProvisioningContext, state: ProvisioningState): Promise<void>;
  initializeAnalytics(context: ProvisioningContext, state: ProvisioningState): Promise<void>;
  createSeoMetadata(context: ProvisioningContext, state: ProvisioningState): Promise<void>;
  assignSellerRole(context: ProvisioningContext, state: ProvisioningState): Promise<void>;
  sendWelcomeEmail(context: ProvisioningContext, state: ProvisioningState): Promise<void>;
  sendSellerNotification(context: ProvisioningContext, state: ProvisioningState): Promise<void>;
  writeApprovalAudit(context: ProvisioningContext, state: ProvisioningState): Promise<void>;
  compensate(step: ProvisioningStep, context: ProvisioningContext, state: ProvisioningState): Promise<void>;
  writeFailureAudit(context: ProvisioningContext, state: ProvisioningState, error: Error): Promise<void>;
  alertFounder(context: ProvisioningContext, state: ProvisioningState, error: Error): Promise<void>;
}
export function shouldStartProvisioning(beforeStatus: unknown, afterStatus: unknown): boolean {
  return beforeStatus !== "approved" && afterStatus === "approved";
}

export async function executeSellerProvisioning(context: ProvisioningContext, dependencies: ProvisioningDependencies): Promise<ProvisioningState> {
  const state: ProvisioningState = { studioId: context.applicationId };
  const completed: ProvisioningStep[] = [];
  try {
    for (const step of CANONICAL_PROVISIONING_STEPS) {
      completed.push(step);
      await dependencies[step](context, state);
    }
    return state;
  } catch (caught) {
    const error = caught instanceof Error ? caught : new Error("Unknown provisioning failure");
    if (error instanceof ProvisioningAlreadyHandledError) throw error;
    for (const step of completed.reverse()) {
      try { await dependencies.compensate(step, context, state); } catch { /* Continue compensation so a later cleanup failure cannot stop earlier cleanup. */ }
    }
    await Promise.allSettled([
      dependencies.writeFailureAudit(context, state, error),
      dependencies.alertFounder(context, state, error),
    ]);
    throw error;
  }
}

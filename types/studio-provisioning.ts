export const STUDIO_PROVISIONING_STEPS = [
  "createStudio",
  "reserveSlug",
  "createStorageTree",
  "initializeAnalytics",
  "createSeoMetadata",
  "assignSellerRole",
  "sendWelcomeEmail",
  "sendSellerNotification",
  "writeApprovalAudit",
] as const;
export type StudioProvisioningStep = (typeof STUDIO_PROVISIONING_STEPS)[number];
export type StudioUnavailableMode = "temporarilyUnavailable" | "notFound";

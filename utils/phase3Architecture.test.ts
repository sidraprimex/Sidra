import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const read = (path: string) => readFileSync(path, "utf8");
describe("Phase 3 architecture", () => {
  it("keeps the exact canonical provisioning sequence", () => {
    const source = read("firebase/functions/src/sellerProvisioningCore.ts");
    const steps = ["createStudio", "reserveSlug", "createStorageTree", "initializeAnalytics", "createSeoMetadata", "assignSellerRole", "sendWelcomeEmail", "sendSellerNotification", "writeApprovalAudit"];
    expect(steps.every((step, index) => source.indexOf(`\"${step}\"`) < source.indexOf(`\"${steps[index + 1] ?? step}\"`) || index === steps.length - 1)).toBe(true);
  });
  it("keeps Firestore access inside services and functions", () => {
    for (const path of ["components/seller-onboarding/SellerApplicationForm.tsx", "components/admin/SellerApplicationsReview.tsx", "app/sell-on-resora/page.tsx"]) expect(read(path)).not.toContain("firebase/firestore");
  });
  it("does not mix Phase 3.5 Discovery Pad or Canvas Engine", () => {
    const manifest = read("docs/FILE-MANIFEST-PHASE-3.md");
    expect(manifest).not.toMatch(/Discovery Pad|Canvas Engine/);
  });
});

# Phase 3 File Manifest

## Public and Founder surfaces
- `app/sell-on-resora/page.tsx`
- `app/admin/sellers/applications/page.tsx`
- `app/studio/[slug]/page.tsx`
- `components/seller-onboarding/SellerApplicationForm.tsx`
- `components/seller-onboarding/ApplicationStatusPanel.tsx`
- `components/admin/SellerApplicationsReview.tsx`
- `components/auth/RoleClaimRefreshBridge.tsx`

## Typed services and contracts
- `services/sellerApplicationService.ts`
- `services/roleRefreshService.ts`
- `services/publicStudioStatusService.ts`
- `types/seller-application.ts`
- `types/studio-provisioning.ts`
- `utils/sellerApplicationValidation.ts`

## Server automation and tests
- `firebase/functions/src/sellerOnboarding.ts`
- `firebase/functions/src/cmsDefaults.ts`
- `firebase/functions/src/cmsDefaults.test.ts`
- `firebase/functions/src/sellerProvisioningCore.ts`
- `firebase/functions/src/sellerProvisioningCore.test.ts`
- `tests/rules/phase3.rules.test.ts`
- `utils/phase3Architecture.test.ts`

Phase 3 contains only seller onboarding, Founder review, automatic Studio provisioning, route-state enforcement and associated security/tests. Product management remains Phase 4.

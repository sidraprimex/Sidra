# SIDRA Phase 13 File Manifest

Final hardening and launch-readiness layer built on the verified Phase 0–12 codebase.

## New application surfaces
- `app/admin/security/page.tsx`
- `app/admin/launch-readiness/page.tsx`
- `components/admin/SecuritySignalDashboard.tsx`
- `components/admin/LaunchReadinessDashboard.tsx`

## New domain and policy files
- `types/phase13-launch-readiness.ts`
- `services/launchReadinessService.ts`
- `utils/securitySignalPolicy.ts`
- `utils/rbacMatrix.ts`
- `firebase/functions/src/launchReadinessPolicy.ts`
- `firebase/functions/src/launchReadiness.ts`
- `firebase/functions/src/backupMaintenance.ts`
- `firebase/functions/src/healthMonitoring.ts`
- `firebase/schema/phase13-launch-readiness.schema.json`

## Verification and release tooling
- `firebase/functions/src/launchReadinessPolicy.test.ts`
- `utils/rbacMatrix.test.ts`
- `utils/phase13Architecture.test.ts`
- `scripts/release/run-release-gate.mjs`
- `scripts/release/backup-restore-drill.sh`
- `scripts/load/checkout-load-test.mjs`
- `docs/PHASE-13-ACCEPTANCE.md`
- `docs/PHASE-13-FINAL-SIGN-OFF.md`

## Modified integration files
- `firebase/functions/src/index.ts`
- `firebase/rules/firestore.rules`
- `firebase/indexes/firestore.indexes.json`
- `services/index.ts`
- `types/index.ts`
- `package.json`

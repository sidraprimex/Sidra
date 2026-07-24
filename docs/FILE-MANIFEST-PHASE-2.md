# Sidra Phase 2 File Manifest

Phase 2 is cumulative: every Phase 0 and Phase 1 file remains, with the following data/security layer added or expanded.

## Schemas

- `types/firestore.ts`
- `types/studio.ts`
- `types/product.ts`
- `types/order.ts`
- `types/custom-order.ts`
- `types/review.ts`
- `types/payment.ts`
- `types/cms.ts`
- `types/audit-log.ts`
- `types/catalog.ts`
- `types/engagement.ts`
- `types/communication.ts`
- `types/finance.ts`
- `types/marketing.ts`
- `types/platform.ts`
- `types/reserved.ts`
- `types/index.ts`

## Services

Firebase client initialization and every active data domain live under `services/`. Components and pages do not call Firestore directly.

## Server enforcement

- `firebase/functions/src/authClaims.ts`
- `firebase/functions/src/audit.ts`
- `firebase/functions/src/orderTimeline.ts`
- `firebase/functions/src/customOrders.ts`
- `firebase/functions/src/reviews.ts`
- `firebase/functions/src/storageMaintenance.ts`

## Security and indexes

- `firebase/rules/firestore.rules`
- `firebase/rules/storage.rules`
- `firebase/indexes/firestore.indexes.json`
- `firebase/schema/collection-registry.json`
- `tests/rules/phase2.rules.test.ts`
- `utils/phase2Architecture.test.ts`

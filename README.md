# SIDRA

Sidra is a curated luxury digital ecosystem for resin art and handcrafted goods.

## Current checkpoint

Phase 0 foundation and Phase 1 authentication/RBAC are included. V1 authentication intentionally supports Email/Password and Google Sign-In only.

## Local validation

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
npm run functions:install
npm run functions:build
```

Rules integration tests require the Firebase emulator:

```bash
npm run test:rules
```

Copy `.env.example` to `.env.local` and enter the existing Sidra Firebase web configuration. Never commit `.env.local` or service-account credentials.

## Phase 2 — Data Layer & Security Rules

This cumulative build preserves the verified Phase 0 foundation and Phase 1 authentication/RBAC layer. Phase 2 adds the authoritative Firestore contracts, domain services, Storage ownership rules, composite indexes, immutable audit/order enforcement, verified-purchase review functions, temporary-upload cleanup, and emulator rule tests. It intentionally adds no feature UI; seller onboarding begins in Phase 3.

See `docs/PHASE-2-INFERRED-SCHEMAS.md`, `docs/PHASE-2-ACCEPTANCE.md`, and `docs/FILE-MANIFEST-PHASE-2.md`.

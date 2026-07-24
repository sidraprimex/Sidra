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

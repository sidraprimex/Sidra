# Phase 1 Acceptance Checklist

- [ ] Email/password registration creates `users/{uid}` with role `customer`.
- [ ] Registration sends email verification.
- [ ] Google Sign-In creates or safely refreshes the same user profile.
- [ ] Unverified customers cannot write carts or wishlists under Firestore rules.
- [ ] Customers cannot change `role`, `studioId`, status, counters, or other protected fields.
- [ ] Custom claims synchronize from the server-side user-document trigger.
- [ ] Founder and superAdmin claims require the explicit UID allow-list.
- [ ] `/account/overview` requires an authenticated, verified account.
- [ ] `/studio-admin/overview` requires seller/founder access and a `studioId` claim.
- [ ] `/admin/overview` allows only the appropriate operational roles.
- [ ] No Apple, phone OTP, or passkey UI or service code exists in V1.
- [ ] Root `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass.
- [ ] Functions dependencies install and `npm run functions:build` passes.
- [ ] Firestore rules tests pass through `npm run test:rules` with the emulator.

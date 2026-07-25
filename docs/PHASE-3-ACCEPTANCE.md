# Phase 3 Acceptance — Seller Onboarding & Automatic Studio Provisioning

- [x] `/sell-on-resora` submits only `sellerApplications`; no client Studio creation exists.
- [x] `/admin/sellers/applications` is Founder/superAdmin protected and exposes all four decisions.
- [x] Every decision is executed server-side and writes an immutable audit entry.
- [x] The provisioning coordinator executes the canonical nine steps in the exact PRD order.
- [x] Automated function-core tests confirm the exact nine-step success order, step-seven reverse rollback of completed steps 1–6, failure audit, and Founder alert.
- [x] Automated transition tests confirm Reject/Hold/Request More Info never start provisioning or touch roles, claims, Studio or route documents.
- [x] Seller role notification triggers forced token refresh without logout/login.
- [x] The CMS seller-welcome template is read from Firestore; an idempotent CMS bootstrap document is created only when the template is absent.
- [x] Studio route status supports the default `temporarilyUnavailable` suspended state and Founder-configurable `notFound` mode.
- [x] Studio slugs are immutable for sellers; product hard-delete remains denied.

Runtime verification requiring Firebase emulators or a deployed staging project is performed after installation with `npm run test:rules`, `npm run functions:test`, and the final Vercel/Firebase end-to-end pass.

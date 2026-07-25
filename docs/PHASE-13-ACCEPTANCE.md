# SIDRA Phase 13 Acceptance Contract

Phase 13 supplies production code, automated policy tests, evidence storage, scheduled controls, and scripts needed to execute the final launch gate. Items that require a real staging project, payment gateway, Google Cloud export, or measured Android/4G run must never be marked passed merely because the code exists.

## Implemented in code
- [x] Consolidated founder-only release-evidence model with ten explicit gates.
- [x] Literal admin RBAC matrix and automated negative checks for role separation.
- [x] Fraud/abuse signals for failed-login bursts, rapid account creation, excessive refunds, and duplicate seller applications.
- [x] Signals are Founder review-only; no automatic account or Studio suspension path exists.
- [x] Founder security-signal view and launch-readiness evidence view.
- [x] Daily backup source-inventory verification and 30-day account purge scheduler.
- [x] Separate-project Firestore export/restore drill script.
- [x] Hourly payment-webhook failure-rate monitor with Founder alert creation.
- [x] Checkout concurrency load-test runner with idempotency keys and duplicate-response detection.
- [x] Firestore rules and indexes for Phase 13 collections.

## Must be executed in Termux/staging before production sign-off
- [ ] Run the complete Firestore and Storage rules suite against emulators.
- [ ] Execute and record every RBAC role × action cell.
- [ ] Perform a real export and restore into a separate Firebase/GCP test project; compare document counts and sampled records.
- [ ] Measure homepage and Product/Studio LCP below 2,000 ms on throttled 4G.
- [ ] Measure search round-trip below 500 ms and suggestions below 150 ms.
- [ ] Measure dashboard first paint below 2,000 ms.
- [ ] Confirm 60 fps opening/card motion on a mid-range Android device, including reduced-motion fallback.
- [ ] Complete the real staging customer journey with a test payment.
- [ ] Verify all nine seller-provisioning steps in staging.
- [ ] Confirm forged payment-webhook signatures are rejected.
- [ ] Confirm zero open critical/high bugs.
- [ ] Run 100, then 1,000, then 10,000 simulated concurrent users and verify zero duplicate orders and zero corrupted inventory.

A production deploy remains blocked until every unchecked item has dated evidence and is saved as `passed` in `releaseEvidence`.

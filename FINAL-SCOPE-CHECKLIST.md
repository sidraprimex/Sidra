# Sidra final scope checklist

## Seller onboarding and access

- One deterministic seller application per Firebase user.
- Portfolio files stored in private Backblaze B2 and previewed by admin.
- Persistent application status with approve, reject, hold and information
  request states.
- Approved application shows prepaid access payment and UTR verification.
- Founder-editable ₹2,000 default onboarding fee.
- Founder-editable installment schedule; first verified down payment provisions
  full Studio access.
- Installment schedule remains visible in the Studio subscription area.
- Overdue policy is founder-controlled and designed for reminders/grace and
  gradual new-business restrictions, without blocking active orders/support.

## Seller plans and profit settlement

- Free: ₹0 and 12% default commission on verified profit.
- Starter: ₹2,500 original, ₹500 launch, up to 10% on verified profit.
- Growth: ₹5,500 original, ₹2,500 launch, 4% on verified profit.
- Luxury Elite: ₹7,500, 1% on verified profit.
- Custom: founder-editable price, commission and benefits.
- All plans, rates, prices, visibility and benefits are Firestore-backed
  founder controls.
- Commission uses profit, not total order value.
- Ready stock receives no production advance.
- Made-to-order supports material, making and post-delivery profit stages.
- Seller wallet and manual UPI/bank/IMPS withdrawal remain available.

## Delhivery delivery

- One central Sidra Delhivery token and wallet.
- Seller never needs a Delhivery account and never pays the pickup agent.
- KYC/pickup details are collected inside Sidra.
- Seller pickup locations can be created under Sidra's Delhivery account.
- Ready to Ship creates/reuses a Delhivery shipment, Air Waybill and pickup.
- Shipping label is downloadable/printable from the seller order page.
- Buyer, seller and admin can open verified live courier tracking.
- Premium animated milestones, scan history, expected delivery and last
  verified scan location.
- No fake GPS map when the courier does not supply coordinates.
- Actual/estimated Delhivery charge is stored in a shipping ledger with zero
  seller out-of-pocket amount and founder-configured allocation.
- Order settlement subtracts verified making cost and courier cost before
  applying plan commission.
- Tracking surfaces Delhivery exception states, including undelivered, Return
  to Origin, lost and delivery milestones.

## Trust, KYC and documents

- Founder can enable/disable KYC and choose basic, standard or enhanced
  requirements.
- PAN, identity proof, bank and pickup requirements are individually editable. Bank details are optional by default; sellers choose UPI, bank transfer or IMPS when withdrawing.
- Only masked last-four identity metadata is stored in Firestore.
- Supporting images/PDFs are stored privately in B2.
- Admin can open private verification files, verify pickup/KYC or request
  correction.
- Delhivery receives only required pickup/consignee fields.

## Buyer protection and policies

- Prepaid checkout only; manual UPI flow remains verifiable by admin.
- Checkout records explicit versioned acceptance of terms, shipping,
  cancellation and damage/claims policies.
- Buyer-caused wrong address, unavailability, refusal or cancellation can
  recover disclosed forward and return shipping costs.
- Valid damaged, wrong, missing or non-delivered claims remain protected.
- Separate Shipping, Cancellation/Refund, Damage/Claims, Seller Agreement,
  Payout/Recovery, Privacy/KYC and Terms pages.
- Default damage/mismatch/missing evidence window is 72 hours and editable.

## No-code founder control

- Business controls for plans, commissions, onboarding fee, installments,
  staged funding, dispute window, Delhivery allocation and KYC.
- Payment mode, UPI/bank details and integration status controls.
- Page/block editor with text, image/video/link blocks, add, remove, duplicate,
  visibility, drag reorder, publish, version and previous-version restore.
- Menu and footer link editor using label and URL fields.
- Global color and card-radius controls.
- Existing role, identity, payment and order invariants remain protected from
  free-form editing.

## Validation status

- TypeScript application and Firebase Functions compilation: passed.
- Strict ESLint: passed.
- `git diff --check`: passed.
- Secret scan: no live Delhivery/B2/Firebase secret added.
- Unit test assertions execute successfully in this workspace, but the local
  Vitest worker does not exit under the workspace sandbox after completing
  assertions.
- The workspace sandbox blocks Next.js production build memory inspection
  (`uv_resident_set_memory`). The same production build must be run in Termux
  or Vercel, where the repository previously built successfully.
- Firestore rules must be compiled/deployed from Termux/Firebase CLI.
- One low-value live order is still required to verify the account-specific
  Delhivery wallet, warehouse, Air Waybill, label and pickup responses. No code
  or ZIP can safely simulate that external paid operation.

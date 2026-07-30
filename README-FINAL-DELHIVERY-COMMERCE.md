# Sidra final commerce and Delhivery release

This release keeps one Sidra marketplace account in control of seller
onboarding, buyer payment, production funding, courier booking, tracking,
claims and seller settlement.

## Required Vercel variables

Keep all secret values only in Vercel. Never commit them.

- `DELHIVERY_API_TOKEN`
- `DELHIVERY_API_BASE_URL=https://track.delhivery.com`
- `DELHIVERY_PICKUP_LOCATION` as a fallback pickup-location name
- all existing `NEXT_PUBLIC_FIREBASE_*` values
- all existing `B2_*` values
- `NEXT_PUBLIC_APP_URL=https://www.sidrajewels.in`

Optional endpoint overrides are documented in `.env.example`.

## Founder setup after deployment

1. Open Admin OS → Business controls.
2. Confirm seller plans, launch prices and profit commission:
   Free 12%, Starter up to 10%, Growth 4%, Luxury Elite 1%, or custom.
3. Confirm the ₹2,000 onboarding fee and installment amounts. Their total
   must equal the onboarding fee.
4. Confirm staged made-to-order funding and the dispute window.
5. Confirm Delhivery shipping-cost allocation, delivery OTP, shipment
   protection and the 72-hour claim window.
6. Confirm KYC fields. Sellers submit masked identity metadata and private B2
   documents under Studio → Verification & pickup.
7. Review KYC inside Admin OS → Seller verification. Verification copies the
   approved pickup address to the Studio and unlocks Ready to Ship.
8. Use Admin OS → Page builder to edit blocks, links, images and videos,
   drag/reorder, duplicate, hide, publish or restore the previous version.

## Order and courier flow

1. Buyer checks out with prepaid payment and accepts the versioned delivery,
   cancellation and claims policies.
2. Admin verifies a manual UPI reference; Sidra creates one order per Studio.
3. Ready-stock orders receive no cost advance. Made-to-order funding follows
   the configured material and making stages.
4. Seller completes production and enters package weight and dimensions.
5. `Ready to ship · create label` calls Sidra's server route. The Delhivery
   token is never exposed to the browser.
6. Sidra creates/reuses the shipment, receives the Air Waybill, estimates the
   courier charge, requests pickup and writes a zero-seller-out-of-pocket
   shipping ledger.
7. Seller downloads/prints the label and attaches it before pickup.
8. Buyer and seller see verified Delhivery scans in the same animated
   milestone tracker. No fake GPS location is shown.
9. Delivered profit is calculated as sale after discount, less verified making
   cost and courier cost. The order's plan commission is charged only on that
   profit.

## Safety and recovery

- Repeating Ready to Ship returns the existing Air Waybill where the order
  already contains one; Delhivery also receives the stable Sidra order number.
- The seller never pays a pickup agent or uses a personal Delhivery account.
- KYC documents are private B2 objects. Firestore stores paths and masked
  last-four metadata, not full Aadhaar/PAN text.
- Buyer-caused failed delivery can recover disclosed forward and Return to
  Origin costs. Valid non-delivery, wrong-item and damage rights remain.
- Damage/mismatch/missing evidence should be filed within the configured
  window (72 hours by default).
- Existing active orders and support remain available even if a future seller
  installment is overdue; restrictions are gradual and founder-controlled.

## Verification before GitHub push

```bash
npm install --legacy-peer-deps
npm run typecheck
npm run lint -- --quiet
npm test
npm run build
git diff --check
```

Then deploy Firestore rules and indexes:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project resora-bd7c5
```

An actual live Air Waybill, pickup and charge cannot be verified without a
serviceable order, a verified pickup location and sufficient Delhivery wallet
balance. Use one low-value internal order for the final production smoke test.

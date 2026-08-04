# Sidra Vercel backend deployment

Sidra's trusted commerce runtime now runs inside authenticated Next.js route handlers on Vercel. A Firebase Blaze plan and deployed Firebase Cloud Functions are not required for checkout, Razorpay verification, manual UPI verification, refunds, order status, seller notifications, launch readiness, custom-order proofs, newsletter protection, handwriting lookup or Delhivery shipment creation.

## Required Vercel environment variables

Configure these for Production, Preview and Development as appropriate:

- `FIREBASE_SERVICE_ACCOUNT_JSON` — the complete Firebase service-account JSON on one line. Alternatively configure `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`.
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `DELHIVERY_API_TOKEN`
- `DELHIVERY_API_BASE_URL`
- `DELHIVERY_PICKUP_LOCATION` when a verified Studio pickup address is not used.
- Existing public `NEXT_PUBLIC_FIREBASE_*` variables.

Never place private keys in `NEXT_PUBLIC_*`, Firestore, Git or the Admin CMS.

## Razorpay webhook

In the Razorpay Dashboard create a webhook for:

`https://sidrajewels.in/api/payments/razorpay/webhook`

Subscribe to `payment.captured` and set the exact same secret in `RAZORPAY_WEBHOOK_SECRET` on Vercel. The route verifies the raw request HMAC, recomputes prices on the server, decrements stock transactionally, creates one seller order per Studio, clears only purchased cart lines and notifies buyer and sellers.

## Firebase deployment still required

Firestore rules remain Firebase infrastructure. After applying this repair, deploy only rules:

```bash
npx firebase-tools deploy --only firestore:rules --project resora-bd7c5
```

Do not run `firebase deploy --only functions`. The live backend is deployed automatically by Vercel after the Git push.

## Release verification

Run the commands in `SIDRA-FINAL-TERMUX-CHECKS.md`, then test one Razorpay test-mode payment, one manual UPI approval, one multi-Studio cart and one Delhivery test shipment before enabling live payments.

# Sidra final Termux and Vercel checks

## 1. Validate the source

Use Node 22.x. The repository intentionally pins Node 22 because Vercel production uses that runtime.

```bash
cd "$HOME/sidra-upload" && \
npm install && \
rm -rf .next && \
npm run typecheck && \
npm run lint -- --quiet && \
git diff --check && \
npx vitest run --maxWorkers=1 --no-file-parallelism && \
npm run build
```

Do not use `npm audit fix --force`. This repair already updates and overrides the affected dependency families without accepting breaking upgrades.

## 2. Configure Vercel

Add the values documented in `SIDRA-VERCEL-BACKEND.md` to the Vercel project. The Firebase service account and every secret must be server-only. Redeploy the latest `main` commit after saving the values.

Expected production backend endpoints:

- `POST /api/backend/[action]` — Firebase-ID-token authenticated application actions.
- `POST /api/payments/razorpay/webhook` — raw-body Razorpay webhook.
- `POST /api/newsletter` — public rate-limited newsletter signup.
- `POST /api/logistics/delhivery/shipment` — seller-authenticated shipment and pickup creation.

## 3. Deploy only Firebase rules

```bash
cd "$HOME/sidra-upload" && \
npx firebase-tools deploy --only firestore:rules --project resora-bd7c5
```

Do **not** deploy Firebase Functions. The trusted runtime is now Vercel.

## 4. Configure Razorpay test mode

1. Put test-mode `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in Vercel.
2. Create the webhook `https://sidrajewels.in/api/payments/razorpay/webhook`.
3. Subscribe to `payment.captured`.
4. Put the identical webhook secret in `RAZORPAY_WEBHOOK_SECRET` on Vercel.
5. Redeploy and complete one small test payment.

Expected result: the payment session changes to paid, seller-scoped orders are created, inventory is reduced once, purchased cart lines disappear, the buyer sees the order and each seller receives a notification.

## 5. Live acceptance matrix

- Product page: change quantity, add to cart, refresh, return to the same checkout state.
- Wishlist: add, refresh, sign out/in and confirm it remains in Account > Wishlist.
- Multi-Studio cart: confirm each selected line and quantity is present and one order is created per Studio.
- Manual payment: submit a UTR, leave the page, confirm pending under Account > Payments, then approve and reject separate test requests from founder admin.
- Razorpay: confirm webhook retries do not duplicate orders or decrement stock twice.
- Seller: confirm new-order notification, buyer delivery address, quantities, settlement figures and status controls.
- Delhivery: create a test shipment, confirm pickup request, label access, AWB and tracking updates.
- Navigation: visit Login, product, cart and checkout; Back must return to the previous marketplace page and must not jump to Register.
- Storefront: change sections, one official Sidra accent, layout and motion; refresh editor and confirm recovery; publish and confirm public order.
- Admin CMS: reorder and publish blocks, refresh and confirm the published version plus draft recovery.

Only after this matrix passes with the real Vercel, Firebase, Razorpay and Delhivery accounts should live payments be enabled.

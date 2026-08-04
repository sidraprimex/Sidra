# Sidra connected commerce master repair

Base: `sidraprimex/Sidra` main at `c40862a` (4 August 2026).

## What this repair fixes

- Razorpay totals are rebuilt inside Firebase Functions from current published products, inventory, address, logistics settings and seller coupon. Client-submitted prices and totals are no longer trusted.
- A captured multi-Studio payment creates one seller-scoped order per Studio with customer address, product quantities, totals, invoice, seller owner and buyer/seller notifications.
- Seller order status changes use the protected `updateOrderStatus` callable instead of unrestricted browser-side batches.
- Every fulfilment stage is buyer-visible and creates a dashboard notification. Delhivery AWB, pickup, label and tracking continue through the existing secured API routes.
- Order detail subscriptions read only the requested order document rather than listening to the whole order collection.
- Customer dashboard unread notification count uses the actual `recipientUid` schema.
- Mobile Back uses a 30-entry session history, avoids sending an authenticated user back to login/register, and falls back safely.
- Seller storefront builder now includes drag ordering, motion presets, layout controls and automatic unsaved-draft recovery. The published storefront consumes its motion/order configuration.
- Vercel/root Node is pinned to Node 22 to match Firebase Functions and avoid automatic Node 24 upgrades.
- Architecture regression tests cover secure totals, seller-scoped orders/notifications and single-order subscriptions.

The existing code already contains the Admin drag/drop CMS, category-specific product frames/animations, cart and checkout recovery, wishlist persistence, Delhivery routes, seller payouts, KYC and founder controls. This repair connects the broken boundaries instead of creating a parallel flow.

## Apply in Termux

From the project root:

```sh
cd "$HOME/sidra-upload"
git status --short
git apply --check "$HOME/storage/downloads/Sidra-connected-commerce-master-repair.patch"
git apply "$HOME/storage/downloads/Sidra-connected-commerce-master-repair.patch"
npm install
npm run typecheck
npm run lint -- --quiet
git diff --check
npx vitest run --maxWorkers=1 --no-file-parallelism
npm run build
```

Deploy the changed backend functions after validation:

```sh
npx firebase-tools deploy --only functions:initiatePayment,functions:razorpayWebhook,functions:updateOrderStatus,functions:getCustomerDashboardSummary --project resora-bd7c5
```

Then commit and push:

```sh
git add -A
git commit -m "Secure and connect Sidra payment order fulfilment and storefront flow"
git push origin main
```

## Live test gate

Use one low-value test product and verify: quantity total; Razorpay amount; separate Studio orders; buyer order page after reload; seller new-order notification; accept → production → quality → packaged; Delhivery label and pickup; tracking; delivered payout. Real Razorpay/Delhivery/Firebase browser testing needs the production secrets and cannot be simulated by a source patch.

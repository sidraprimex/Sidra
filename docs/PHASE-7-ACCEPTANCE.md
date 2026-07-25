# SIDRA Phase 7 Acceptance Contract

- Illegal transitions such as `placed -> delivered` are rejected server-side.
- Sellers can only transition orders belonging to their custom-claim Studio.
- Founder forced transitions require a reason and create immutable before/after audit entries.
- Each accepted transition appends exactly one timeline entry.
- `readyToShip` requires package weight, dimensions, courier, tracking number, and estimated delivery date.
- Customer tracking exposes only Placed, Shipped, In Transit, Out for Delivery, and Delivered.
- Review CTA appears only for delivered or completed orders.
- Post-production customer cancellation/refund requests route to Founder adjudication.
- Founder-approved refunds call the Razorpay test/production API according to deployed secrets.
- Payment status is updated only after a successful gateway refund response.
- Commission reads `settings/commission` at completion time.
- Completion creates one pending payout with gross, commission, and seller-net amounts.
- V1 payout execution remains manual bank transfer confirmation; no automatic payout API is included.

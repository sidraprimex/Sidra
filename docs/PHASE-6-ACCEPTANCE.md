# SIDRA Phase 6 Acceptance Contract

- Cart requires a verified authenticated account and persists in `carts/{uid}`.
- Multi-Studio carts disclose the split before payment.
- Checkout has exactly four steps: address, delivery/review, payment, confirmation.
- Coupon UI honestly states Phase 12 ownership and never applies a fake discount.
- Client never creates an order and never writes `paymentStatus: paid`.
- `initiatePayment` creates the gateway order server-side.
- `razorpayWebhook` verifies the raw-body HMAC signature before trusting payload data.
- Invalid signatures create a fraud-oriented audit record and return HTTP 401.
- Payment documents use the gateway payment ID as the idempotency key.
- The verified webhook transaction generates the RSR sequential order number, creates one order and one payment, appends the first timeline event, and decrements finite inventory.
- Paid inventory conflicts create a Founder notification rather than silently discarding a paid order.
- Failed or cancelled gateway events do not create orders.
- Confirmation UI waits for the verified order document instead of trusting the client gateway callback.
- Invoice output is immutable and written once under `invoices/{orderId}`.

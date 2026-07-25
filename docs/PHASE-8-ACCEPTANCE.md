# SIDRA Phase 8 Acceptance Contract

- Customers submit complete custom-order briefs to an active Studio.
- No payment is requested before a formal quote exists and the customer accepts it.
- Sellers cannot start production before verified payment changes the custom order to `paid`.
- Quotes include creation price, shipping, total, production days, revision limit, expiry, and terms.
- Quote acceptance creates a server-owned Razorpay payment session.
- Client callbacks never mark a custom order as paid.
- Only participants, Founder, and Support can read the custom-order conversation.
- Messages are appended through callable functions and cannot be edited directly from the client.
- Sellers submit proof images only while the order is in production or awaiting revision.
- Customers alone approve proofs or request revisions.
- Revision requests require a written reason.
- Seller cannot self-approve a proof.
- Custom-order disputes and post-production refund adjudication remain Founder-controlled.
- The verified Phase 6 payment webhook remains the only authority that may create the linked marketplace order after payment.

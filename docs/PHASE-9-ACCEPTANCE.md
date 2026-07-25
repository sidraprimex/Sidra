# SIDRA Phase 9 Acceptance Contract

- Customer dashboard counts are generated server-side for the authenticated customer only.
- Wishlist items are private to the customer and toggled through callable Functions.
- Studio follows are private to the customer and use one deterministic customer-Studio identity.
- Reviews require a delivered or completed order owned by the authenticated customer.
- The reviewed product must exist in the purchased order line items.
- One customer cannot review the same product twice from the same order.
- New reviews are verified purchases and enter moderation as `pending`.
- Public product pages read only `published` reviews.
- Sellers can respond only to published reviews belonging to their Studio.
- Product rating aggregates update from published reviews only.
- Customer notification subscriptions are scoped by customer ID.
- Direct client writes to reviews, wishlist items, and Studio follows are denied.

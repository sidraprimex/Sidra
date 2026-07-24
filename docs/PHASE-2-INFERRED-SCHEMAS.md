# Sidra Phase 2 — Inferred V1 Schemas

The Master Blueprint defines `studios`, `products`, `orders`, `customOrders`, `reviews`, `payments`, `cms`, and `auditLogs` field-for-field. The remaining V1-active collections below are inferred only from Blueprint chapters 7–15 and preserve the same camelCase and typed-enum conventions.

## Catalog

- `categories`: identity, slug, editorial copy, media, featured/active/sort controls, category-level return policy, SEO reference, timestamps.
- `collections`: identity, slug, editorial copy, media, ordered product references, featured/active/sort controls, SEO reference, timestamps.

## Customer engagement

- `followers`: deterministic customer↔studio relationship with timestamps.
- `wishlists`: one document per UID containing typed product snapshots and add timestamps.
- `carts`: one document per UID containing product, studio, variant, quantity, price snapshot and coupon state.

## Communication

- `notifications`: recipient, audience, type, content, V1 channels (`inApp`, `email`), read state, context and action link.
- `messages`: conversation + required context (`productInquiry`, `customOrder`, `supportTicket`), sender, recipients, body, attachments and edit/delete metadata. No open-ended DM type exists.
- `supportTickets`: subject/category/description, optional order/product/studio references, attachments, assigned admin, contextual conversation, locked lifecycle and satisfaction rating.

## Finance and growth

- `payouts`: studio, covered orders, gross/commission/refund/net amounts, INR, pending/available/paid/held/cancelled lifecycle and bank confirmation metadata.
- `coupons`: fixed/percentage/free-shipping discount, product/category/studio scope, date window, minimum order, limits and activation.
- `campaigns`: scheduled lifecycle, homepage block references, landing-page CMS reference and coupon references.

## Editorial and media

- `journal`: slug, editorial content blocks, cover, author, category/tags, publishing lifecycle and timestamps.
- `media`: owner type/id, Storage path, URL, file metadata, dimensions, accessibility copy and creator.

## Operations

- `analytics`: subject + period keyed metrics for views, visitors, conversion, orders, revenue, refunds and followers.
- `settings`: maintenance, moderation, return/review windows, subscription tier limits and configurable commission strategy.
- `automationRules`: locked trigger enum, typed conditions/actions, activation and audit metadata.
- `corporateLeads`: company/contact, requirement, quantity/budget/deadline, assignment, notes and CRM lifecycle.
- `seo`: entity reference, canonical metadata, OG media, keywords, Firestore search tokens, structured data and no-index control.

## Reserved and inactive in V1

`affiliates`, `giftCards`, `loyaltyLedger`, and `subscriptionsBilling` have TypeScript-only contracts in `types/reserved.ts`. Their Firestore rules deny all access. No UI or feature function activates them.

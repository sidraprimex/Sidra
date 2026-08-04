# Sidra 12-point completion map

This repair keeps one connected marketplace flow. Firebase remains the identity and database layer; every privileged commerce operation now runs through authenticated Next.js route handlers on Vercel. Firebase Cloud Functions are no longer required by the web application.

## What is included

1. **Admin dead-action repair** — privileged admin services now call the authenticated Vercel backend instead of undeployed Firebase callable functions.
2. **Drag-and-drop Admin CMS** — block add, edit, reorder, duplicate, remove, publish, version and local recovery remain connected to the CMS service.
3. **No-code seller storefront builder** — identity, logo, banner, announcement, story, collections, policies and products can be arranged without code.
4. **Seller theme and motion controls** — the five official Sidra colours, section order, product layout and restrained motion presets are validated and rendered publicly.
5. **Product-type presentation** — existing category-aware product cards and motion remain connected to product, category, collection, Studio and search routes.
6. **Navigation continuity** — Back uses preserved in-app history; its safe fallback is Home or the signed-in dashboard, never Login/Register.
7. **Dashboard-to-database connection** — customer, seller and founder actions use Firebase Auth tokens and Vercel server authorization before Admin SDK writes.
8. **Order fulfilment lifecycle** — paid order, seller notification, acceptance, production, packing, Delhivery pickup, shipping and delivery transitions are validated server-side.
9. **Unified order workspace** — seller order detail contains buyer address, line quantities, private cost, commission, expected earning, package, label and tracking data.
10. **Persistent recovery** — checkout, product form, storefront builder and CMS drafts recover locally after refresh or temporary network loss.
11. **Connected payments** — Razorpay uses a signed raw-body webhook; manual UPI/bank proof remains available with founder approval/rejection and persistent buyer status.
12. **Release protection** — server-side price and stock validation, transactional order creation, seller-scoped orders, security tests, Node 22 pinning, lint/type checks and dependency audit are included.

## Acceptance still required on the live accounts

Source validation cannot prove third-party credentials or live account configuration. Before enabling live sales, complete the acceptance matrix in `SIDRA-FINAL-TERMUX-CHECKS.md`: one Razorpay test payment, one manual approval, one multi-Studio cart, one wishlist recovery, one seller fulfilment and one Delhivery test shipment. These checks verify Vercel environment values, Razorpay webhook configuration, Firebase rules and Delhivery account behaviour.

# SIDRA Admin OS / CMS

This package turns `/admin/control-center` into the central operating room for Sidra.

## Admin access

The verified login email configured in `config/adminAccess.ts` receives the `admin` role in the UI. Firestore rules independently verify the same email. Admins created later can be assigned `role: "admin"` from the Users workspace.

## Workspaces

- Overview: users, Studios, products, support, seller requests and payment checks.
- Global search: searches loaded users, Studios, products, orders, tickets and payment requests.
- Users: role changes, suspension/activation and full-record editing.
- Sellers: Studio activation, suspension, featured placement and full-record editing.
- Seller applications: approve, reject, request information or hold; approval creates the Studio and seller role without Cloud Functions.
- Products: publish, hide, feature and edit all fields.
- Orders: order/payment status, tracking fields and full-record editing.
- Support: ticket status and manual payment verification.
- CMS: edit `cms/homepage`, `cms/navigation`, `cms/footer`, `cms/policies`, `cms/textOverrides` or any future CMS document.
- Appearance: global Sidra color tokens and card radius.
- Payments: Razorpay/manual/hybrid/disabled mode, UPI and bank instructions.
- Firebase data: inspect, create, edit or delete documents in any collection.
- Audit: every Admin OS save is written to `adminAuditLogs`.

## CMS document examples

### `cms/navigation`

```json
{
  "items": [
    { "id": "studios", "label": "Studios", "href": "/studios", "enabled": true }
  ]
}
```

### `cms/policies`

```json
{
  "privacy": { "eyebrow": "Sidra legal", "title": "Privacy Policy", "body": "Paragraph one.\n\nParagraph two." },
  "noRefund": { "eyebrow": "Made for you", "title": "No-Return & No-Refund Policy", "body": "..." },
  "shipping": { "eyebrow": "Production & delivery", "title": "Shipping Policy", "body": "..." },
  "terms": { "eyebrow": "Sidra legal", "title": "Terms & Conditions", "body": "..." }
}
```

### `cms/textOverrides`

This is a bridge for changing any exact visible phrase without editing code. It does not change SEO metadata.

```json
{
  "replacements": [
    { "from": "Open a Studio", "to": "Become a Sidra Artist", "enabled": true }
  ]
}
```

### `cms/homepage`

The existing `blocks` array controls headings, CTA labels, visibility and order. The Hero block also supports:

- `videoUrl`
- `heroImages`
- `wallImages`

The document root supports `backgroundImages` for the homepage slideshow.

## Payment safety

The Admin OS stores payment mode, public identifiers and customer instructions. Private Razorpay secrets, Apple keys and webhook secrets must remain in Vercel/Firebase environment variables. Exposing secrets in browser Firestore would compromise the account.

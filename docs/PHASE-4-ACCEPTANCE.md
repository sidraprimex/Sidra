# SIDRA Phase 4 Acceptance Contract

- Founder-only category and collection management is implemented at `/admin/categories` and `/admin/collections`.
- Sellers assign existing taxonomy and cannot create taxonomy through the rules layer.
- Product list, create, and edit routes exist under `/studio-admin/products`.
- Draft, pending review, published, archived, and suspended states are represented.
- Delete is soft archive only.
- Duplicate removes media, SKU, and slug.
- Product submission requires at least one image.
- Optimized and original media are stored separately.
- Product moderation is configurable from `settings/productModeration`.
- Product cards use category-aware frames with a fallback.
- Product creation reuses Phase 3.5 `CardFramePreview`.
- Upload validation runs server-side.

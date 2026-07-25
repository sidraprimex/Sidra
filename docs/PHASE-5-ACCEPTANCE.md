# SIDRA Phase 5 Acceptance Contract

- `/` reads `cms/homepage`, renders ordered typed blocks, and exports a 60-second revalidation window.
- The locked block order is Hero, FeaturedStudios, FeaturedCollections, SignatureCategories, BestSellers, NewArrivals, CustomOrderBanner, WhyResora, ArtistStories, Testimonials, Journal, Newsletter.
- `/studios` filters active, non-suspended Studios and provides loading, empty, and error states.
- `/studio/[slug]` rejects missing or unavailable Studios.
- `/product/[slug]` includes gallery, variants, quantity, cart/buy controls, story, related products, and recently viewed tracking.
- `/category/[slug]` and `/collection/[slug]` render published product grids.
- `/search` uses the Phase 2 service interface and a Firestore-maintained token index.
- Anonymous recently viewed uses local storage; authenticated storage is user-owned in Firestore and capped at twenty entries.
- No third-party search provider or generative recommendation system is introduced.

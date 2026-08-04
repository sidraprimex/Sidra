# Sidra connected luxury commerce repair

This package adds a connected buyer cart and wishlist surface, product-card heart controls, richer customer dashboard navigation, seller-order normalization for both single-studio and multi-studio paid orders, detailed seller order cards, and animated customer tracking.

Important deployment note: deploy the included Firestore rules/indexes and Firebase Functions together with the web build. Razorpay webhook orders created with `studioIds` are now readable by the Studio order workspace through `array-contains`; direct/manual orders using `studioId` remain supported.

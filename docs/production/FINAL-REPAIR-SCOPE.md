# Sidra Final Production Repair

This source package continues from homepage commit `fc87b02` and applies the second repair pass across the authenticated platform.

## Completed in this repair

1. Customer dashboard now uses the authenticated Firebase UID.
2. Customer orders use the authenticated Firebase UID.
3. Customer custom orders use the authenticated Firebase UID.
4. Customer wishlist uses the authenticated Firebase UID.
5. Customer notifications use the authenticated Firebase UID.
6. Cart uses the authenticated Firebase UID.
7. Checkout uses the authenticated Firebase UID.
8. Customer pages are protected by verified-account routing.
9. Seller overview uses the verified Studio claim.
10. Seller analytics uses the verified Studio claim.
11. Seller products use the verified Studio claim.
12. New product creation uses the authenticated seller UID and Studio claim.
13. Seller orders, custom orders and payouts use the verified Studio claim.
14. Seller coupons, customer segments and campaigns use the verified Studio claim.
15. Founder overview loads the live founder control-center callable.
16. Broken dashboard links were redirected to existing production routes.
17. The legacy Resora seller route redirects to Sidra onboarding.
18. Phase/demo wording was removed from customer-facing surfaces.
19. Buyer, seller and founder spaces use one responsive luxury dashboard shell.
20. A static connection gate rejects hardcoded current-customer/current-seller/current-studio identifiers.

## Deployment requirements

The application still requires valid production environment variables, deployed Firebase Functions, Firestore indexes, Firestore rules, Storage rules, and the configured Razorpay production/test credentials appropriate to the deployment environment. Code cannot create or approve third-party credentials automatically.

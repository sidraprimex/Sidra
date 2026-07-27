SIDRA AUTH + BUYER UX REPAIR

Included in this package:
- Premium responsive Sidra login and registration screens
- Continue with Google and Continue with Apple code paths
- Exact Firebase authentication error messages instead of a generic failure
- Login redirect to product search/discovery so successful login is visible
- Registration fields: full name, phone, email, password
- Buyer dashboard navigation: Marketplace, Overview, Profile, Orders, Custom orders, Wishlist, Notifications, Support
- Buyer Profile & Addresses page
- Browser-local profile photo with clear device-only behaviour
- Firestore-backed editable buyer name, phone and delivery addresses
- Dashboard Shop/back-to-marketplace controls
- Mobile horizontal dashboard navigation improvements

Important live requirements:
- Google provider must be enabled in Firebase Authentication.
- Apple provider must be fully configured with Apple Service ID, Team ID, Key ID and private key; enabling the switch alone is not sufficient.
- The exact Vercel domain must be in Firebase Authentication authorized domains.
- Vercel production environment variables must belong to the resora-bd7c5 Firebase project and the deployment must be redeployed after changes.

Validation note:
The source was structurally audited. Full npm validation could not be completed in the packaging environment because dependency installation was interrupted. Run the included Termux validation commands after installation before pushing.

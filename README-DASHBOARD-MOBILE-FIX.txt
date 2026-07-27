SIDRA Dashboard + Mobile UX Fix

Included:
- Mobile slide-out dashboard menu
- Back button and Home/Marketplace escape routes
- Cleaner professional buyer overview cards
- Support and marketplace quick actions
- Seller experience validation now accepts "2" or descriptive text and shows examples
- Profile/address saves now stop with a useful timeout error instead of hanging forever
- Dashboard unavailable notice changed from alarming error styling to a neutral connected-state notice

Important:
- The black circular "N" badge and side handles visible on localhost are Next.js development tools. They do not appear in the production Vercel deployment.
- Localhost itself does not prevent Firebase writes. A hanging/failed write means network, Firestore rules, user verification, or deployed backend configuration must be checked.

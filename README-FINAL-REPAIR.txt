SIDRA FINAL PRODUCTION REPAIR — PHASE 2

This is a full source package, not a small media-only delta.
It contains the completed homepage repair plus the authenticated buyer, seller and founder connection repair.

Termux installation:
1. Extract this ZIP in Downloads.
2. Enter the extracted folder.
3. Run:
   bash INSTALL-TERMUX.sh ~/sidra-repair/Sidra-main

The installer:
- creates a timestamped backup
- preserves the existing .git repository and .env.local
- replaces application source safely
- runs the static connection gate
- installs packages
- runs TypeScript, ESLint, tests and production build

Do not commit until all verification commands pass and localhost has been checked.
Firebase Functions, indexes, rules and third-party credentials must be deployed/configured in the real project environment.

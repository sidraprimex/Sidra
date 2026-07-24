# Sidra contribution workflow
- `main`: production-approved code only.
- `development`: integration branch.
- `release`: staging candidate; Vercel preview/staging verification happens here.
- `feature/*`: one bounded feature or phase correction.
- `hotfix/*`: urgent production correction.
Every pull request must pass typecheck, lint, tests and production build. Production deployment requires a human approval in the hosting dashboard. Never commit `.env.local` or privileged Firebase credentials.

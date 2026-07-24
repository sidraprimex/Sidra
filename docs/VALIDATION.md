# Phase 0 validation

Completed before packaging:

- Every JSON file parsed successfully.
- Every TypeScript and TSX file passed TypeScript syntax transpilation.
- Every local `@/…` import was checked against an existing exact-case file path.
- Visible content registry was checked for legacy public brand names.
- Firebase configuration is environment-driven and the internal legacy Firebase project ID is not shown in public UI.

The container could not complete an npm registry download within its execution window, so the final dependency installation and `npm run check` must be executed in Termux/Vercel. The ZIP includes a GitHub quality workflow that blocks a merge when typecheck, lint, tests, or build fails.

# Phase 2 Acceptance Record

## Implemented in this cumulative package

- All 28 V1-active collections are registered and represented by committed TypeScript schemas.
- Four reserved collections have type-only contracts and deny-all rules.
- The exact Blueprint §6.3 Storage tree is covered by ownership-aware Storage rules.
- A scheduled Cloud Function purges `/temp/{uid}/...` files older than 24 hours.
- All six locked §6.4 composite index families exist, plus indexes required by the committed service queries.
- Orders and custom orders deny every direct client write.
- Order timeline changes use a validated Cloud Function transaction and append a new immutable event.
- Audit logs deny client create/update/delete, including Founder clients.
- Verified reviews use a server-side order check; direct review creation is denied.
- Domain services isolate production UI code from direct Firestore access.
- Automated rule tests cover cross-studio products, direct order mutation, review spoofing, immutable audit logs and cross-studio orders.

## Termux verification sequence

1. `npm install`
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `npm run build`
6. `npm run functions:check`
7. `npm run rules:install`
8. `npm run test:rules`

Rules and callable-function runtime acceptance requires Firebase Emulator Suite or a configured development Firebase project. A successful Next.js build alone does not prove emulator security behavior.

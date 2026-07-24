# Sidra Phase 1 File Manifest

Phase 1 adds the complete authentication and authorization foundation on top of the verified Phase 0 checkpoint.

## New application files
- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/forgot-password/page.tsx`
- `app/verify-email/page.tsx`
- `app/not-authorized/page.tsx`
- `app/account/overview/page.tsx`
- `app/studio-admin/overview/page.tsx`
- `app/admin/overview/page.tsx`
- `components/auth/AuthProvider.tsx`
- `components/auth/AuthShell.tsx`
- `components/auth/AuthDivider.tsx`
- `components/auth/FormField.tsx`
- `components/auth/GoogleSignInButton.tsx`
- `components/account/AccountShell.tsx`
- `hooks/useAuth.ts`
- `hooks/useRouteGuard.ts`
- `services/authService.ts`
- `services/userService.ts`
- `types/auth.ts`
- `utils/authErrors.ts`

## Firebase and security files
- `firebase/functions/package.json`
- `firebase/functions/tsconfig.json`
- `firebase/functions/src/index.ts`
- `tests/rules/users.rules.test.ts`

## Updated files
- `app/layout.tsx`
- `firebase/rules/firestore.rules`
- `firebase/rules/storage.rules`
- `.env.example`
- `package.json`
- `package-lock.json`

Apple Sign-In, phone OTP, and passkeys are intentionally absent because the V1 authentication lock requires Email/Password and Google Sign-In only.
- `tests/rules/package.json`
- `tests/rules/tsconfig.json`

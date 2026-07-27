"use client";

import { AccountShell } from "@/components/account/AccountShell";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export function AuthenticatedCheckoutPage(): React.JSX.Element {
  const auth = useRouteGuard();
  if (auth.loading || !auth.user) return <LoadingSkeleton count={6} />;
  return <AccountShell mode="customer" eyebrow="Secure purchase" title="Checkout"><CheckoutFlow userId={auth.user.uid} /></AccountShell>;
}

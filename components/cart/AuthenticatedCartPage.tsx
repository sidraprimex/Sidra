"use client";

import { AccountShell } from "@/components/account/AccountShell";
import { CartPageClient } from "@/components/cart/CartPageClient";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export function AuthenticatedCartPage(): React.JSX.Element {
  const auth = useRouteGuard();
  if (auth.loading || !auth.user) return <LoadingSkeleton count={5} />;
  return <AccountShell mode="customer" eyebrow="Your selected pieces" title="Cart"><CartPageClient userId={auth.user.uid} /></AccountShell>;
}

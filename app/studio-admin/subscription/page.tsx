"use client";

import { AccountShell } from "@/components/account/AccountShell";
import { SellerSubscriptionManager } from "@/components/studio-admin/SellerSubscriptionManager";
import { PremiumLoader } from "@/components/ui/PremiumLoader";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export default function SellerSubscriptionPage(): React.JSX.Element {
  const auth = useRouteGuard({
    allowedRoles: ["seller", "founder", "superAdmin"],
    requireStudioId: true,
  });
  if (auth.loading || !auth.user || !auth.claims?.studioId) {
    return <PremiumLoader fullPage label="Opening seller plans" />;
  }
  return <AccountShell mode="seller" eyebrow="Seller commercial plan" title="Subscription & commission"><SellerSubscriptionManager studioId={auth.claims.studioId} sellerUid={auth.user.uid} /></AccountShell>;
}

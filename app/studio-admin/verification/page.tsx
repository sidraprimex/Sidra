"use client";

import { AccountShell } from "@/components/account/AccountShell";
import { SellerVerificationManager } from "@/components/studio-admin/SellerVerificationManager";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export default function StudioVerificationPage(): React.JSX.Element {
  const auth = useRouteGuard({ allowedRoles: ["seller", "founder", "superAdmin"], requireStudioId: true });
  if (auth.loading || !auth.user || !auth.claims?.studioId) return <LoadingSkeleton count={6} />;
  return <AccountShell mode="seller" eyebrow="Studio trust & pickup" title="Verification"><SellerVerificationManager studioId={auth.claims.studioId} sellerUid={auth.user.uid} /></AccountShell>;
}

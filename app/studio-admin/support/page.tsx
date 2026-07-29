"use client";

import { AccountShell } from "@/components/account/AccountShell";
import { CreateSupportTicketForm } from "@/components/support/CreateSupportTicketForm";
import { PremiumLoader } from "@/components/ui/PremiumLoader";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export default function SellerSupportPage(): React.JSX.Element {
  const auth = useRouteGuard({
    allowedRoles: ["seller", "founder", "superAdmin"],
    requireStudioId: true,
  });
  if (auth.loading || !auth.user || !auth.claims?.studioId) {
    return <PremiumLoader fullPage label="Opening Studio support" />;
  }
  return <AccountShell mode="seller" eyebrow="Direct admin contact" title="Studio support"><CreateSupportTicketForm /></AccountShell>;
}

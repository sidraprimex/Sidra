"use client";

import { AccountShell } from "@/components/account/AccountShell";
import { NotificationCenter } from "@/components/customer/NotificationCenter";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";

export function CustomerNotificationsClient(): React.JSX.Element {
  const auth = useRouteGuard();
  if (auth.loading || !auth.user) return <LoadingSkeleton count={5} />;
  return <AccountShell mode="customer" eyebrow="Updates that matter" title="Notifications"><NotificationCenter customerId={auth.user.uid} /></AccountShell>;
}

"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { CustomerOrderDetail } from "@/components/orders/CustomerOrderDetail";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { subscribeOrderConfirmation } from "@/services/orderConfirmationService";
import type { OrderConfirmation } from "@/types/phase6-commerce";

export default function AdminOrderTrackingPage(): React.JSX.Element {
  const auth = useRouteGuard({ allowedRoles: ["admin", "founder", "superAdmin"] });
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderConfirmation | null | undefined>(undefined);
  const [error, setError] = useState("");
  useEffect(
    () => params.id
      ? subscribeOrderConfirmation(
          params.id,
          (value) => {
            setOrder(value);
            setError("");
          },
          (caught) => {
            setOrder(null);
            setError(caught.message);
          },
        )
      : undefined,
    [params.id],
  );
  if (auth.loading || !auth.user || order === undefined) return <LoadingSkeleton count={6} />;
  if (error) return <AccountShell mode="admin" eyebrow="Courier operations" title="Tracking unavailable"><ErrorState message={error} onRetry={() => window.location.reload()} /></AccountShell>;
  if (!order) return <AccountShell mode="admin" eyebrow="Courier operations" title="Order not found"><ErrorState message="This order does not exist or is no longer available." /></AccountShell>;
  return <AccountShell mode="admin" eyebrow="Courier operations" title="Live order tracking"><CustomerOrderDetail order={order as never} /></AccountShell>;
}

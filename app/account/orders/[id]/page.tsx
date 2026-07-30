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

export default function CustomerOrderDetailPage(): React.JSX.Element {
  const auth = useRouteGuard({ allowedRoles: ["customer", "admin", "founder", "superAdmin"] });
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderConfirmation | null | undefined>(undefined);
  const [error, setError] = useState("");
  useEffect(
    () => params.id && auth.user
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
    [auth.user, params.id],
  );
  if (auth.loading || !auth.user || order === undefined) return <LoadingSkeleton count={6} />;
  if (error) return <AccountShell mode="customer" eyebrow="Order tracking" title="Tracking unavailable"><ErrorState message={error} onRetry={() => window.location.reload()} /></AccountShell>;
  if (!order) return <AccountShell mode="customer" eyebrow="Order tracking" title="Order not found"><ErrorState message="This order does not exist or is not available to this account." /></AccountShell>;
  return <AccountShell mode="customer" eyebrow="Order tracking" title="Your delivery"><CustomerOrderDetail order={order as never} /></AccountShell>;
}

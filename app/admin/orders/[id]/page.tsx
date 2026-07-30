"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { CustomerOrderDetail } from "@/components/orders/CustomerOrderDetail";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { subscribeOrderConfirmation } from "@/services/orderConfirmationService";
import type { OrderConfirmation } from "@/types/phase6-commerce";

export default function AdminOrderTrackingPage(): React.JSX.Element {
  const auth = useRouteGuard({ allowedRoles: ["admin", "founder", "superAdmin"] });
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderConfirmation | null>(null);
  useEffect(() => params.id ? subscribeOrderConfirmation(params.id, setOrder) : undefined, [params.id]);
  if (auth.loading || !auth.user || !order) return <LoadingSkeleton count={6} />;
  return <AccountShell mode="admin" eyebrow="Courier operations" title="Live order tracking"><CustomerOrderDetail order={order as never} /></AccountShell>;
}

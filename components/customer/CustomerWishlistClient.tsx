"use client";

import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { WishlistGrid } from "@/components/customer/WishlistGrid";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { listCustomerWishlist } from "@/services/customerEngagementService";
import type { WishlistItem } from "@/types/phase9-customer";

export function CustomerWishlistClient(): React.JSX.Element {
  const auth = useRouteGuard();
  const [items, setItems] = useState<readonly WishlistItem[] | null>(null);
  useEffect(() => {
    if (!auth.user) return;
    void listCustomerWishlist(auth.user.uid).then(setItems).catch(() => setItems([]));
  }, [auth.user]);
  if (auth.loading || !auth.user || !items) return <LoadingSkeleton count={5} />;
  return <AccountShell mode="customer" eyebrow="Saved pieces" title="Wishlist"><WishlistGrid initialItems={[...items]} /></AccountShell>;
}

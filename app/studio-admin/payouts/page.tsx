"use client";

import { useCallback, useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { SellerWalletManager } from "@/components/studio-admin/SellerWalletManager";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { listStudioPayouts } from "@/services/orderLifecycleService";
import { listSellerWithdrawals } from "@/services/sellerWithdrawalService";
import type { SellerPayout, SellerWithdrawal } from "@/types/phase7-orders";

export default function StudioPayoutsPage(): React.JSX.Element {
  const auth = useRouteGuard({ allowedRoles: ["seller", "founder", "superAdmin"], requireStudioId: true });
  const [payouts, setPayouts] = useState<readonly SellerPayout[] | null>(null);
  const [withdrawals, setWithdrawals] = useState<readonly SellerWithdrawal[] | null>(null);
  const load = useCallback(async () => {
    if (!auth.claims?.studioId) return;
    const [nextPayouts, nextWithdrawals] = await Promise.all([listStudioPayouts(auth.claims.studioId), listSellerWithdrawals(auth.claims.studioId)]);
    setPayouts(nextPayouts); setWithdrawals(nextWithdrawals);
  }, [auth.claims?.studioId]);
  useEffect(() => { void load().catch(() => { setPayouts([]); setWithdrawals([]); }); }, [load]);
  if (auth.loading || !auth.user || !payouts || !withdrawals) return <LoadingSkeleton count={6} />;
  return <AccountShell mode="seller" eyebrow="Seller finance" title="Wallet & withdrawals"><SellerWalletManager studioId={auth.claims!.studioId!} payouts={payouts} withdrawals={withdrawals} onReload={load} /></AccountShell>;
}

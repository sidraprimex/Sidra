"use client";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { PayoutSummary } from "@/components/orders/PayoutSummary";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { listStudioPayouts } from "@/services/orderLifecycleService";
import type { SellerPayout } from "@/types/phase7-orders";
export default function StudioPayoutsPage(): React.JSX.Element { const auth=useRouteGuard({allowedRoles:["seller","founder","superAdmin"],requireStudioId:true}); const [payouts,setPayouts]=useState<readonly SellerPayout[]|null>(null); useEffect(()=>{if(!auth.claims?.studioId)return;void listStudioPayouts(auth.claims.studioId).then(setPayouts).catch(()=>setPayouts([]));},[auth.claims?.studioId]); if(auth.loading||!auth.user||!payouts)return <LoadingSkeleton count={6}/>; return <AccountShell mode="seller" eyebrow="Seller finance" title="Payouts"><PayoutSummary payouts={[...payouts]}/></AccountShell>; }

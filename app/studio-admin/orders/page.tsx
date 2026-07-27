"use client";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { SellerOrderBoard } from "@/components/orders/SellerOrderBoard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { listStudioOrders } from "@/services/orderLifecycleService";
import type { FulfilmentOrder } from "@/types/phase7-orders";
export default function StudioOrdersPage(): React.JSX.Element { const auth=useRouteGuard({allowedRoles:["seller","founder","superAdmin"],requireStudioId:true}); const [orders,setOrders]=useState<readonly FulfilmentOrder[]|null>(null); useEffect(()=>{if(!auth.claims?.studioId)return;void listStudioOrders(auth.claims.studioId).then(setOrders).catch(()=>setOrders([]));},[auth.claims?.studioId]); if(auth.loading||!auth.user||!orders)return <LoadingSkeleton count={6}/>; return <AccountShell mode="seller" eyebrow="Fulfilment workspace" title="Studio orders"><SellerOrderBoard orders={[...orders]}/></AccountShell>; }

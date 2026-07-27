"use client";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { SellerGrowthManager } from "@/components/studio-admin/SellerGrowthManager";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { listCustomerSegments } from "@/services/sellerGrowthService";
export default function Page(): React.JSX.Element { const auth=useRouteGuard({allowedRoles:["seller","founder","superAdmin"],requireStudioId:true}); const [options,setOptions]=useState<readonly {id:string;name:string}[]|null>(null); useEffect(()=>{if(!auth.claims?.studioId)return;void listCustomerSegments(auth.claims.studioId).then((items)=>setOptions(items.map((s)=>({id:s.segmentId,name:s.name})))).catch(()=>setOptions([]));},[auth.claims?.studioId]); if(auth.loading||!auth.user||!auth.claims?.studioId||!options)return <LoadingSkeleton count={5}/>; return <AccountShell mode="seller" eyebrow="Studio growth engine" title="Campaigns"><SellerGrowthManager studioId={auth.claims.studioId} mode="campaign" segmentOptions={options}/></AccountShell>; }

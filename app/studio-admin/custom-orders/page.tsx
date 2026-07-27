"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { listStudioCustomOrders } from "@/services/customOrderService";
import type { CustomOrder } from "@/types/phase8-custom-orders";
export default function StudioCustomOrdersPage(): React.JSX.Element { const auth=useRouteGuard({allowedRoles:["seller","founder","superAdmin"],requireStudioId:true}); const [orders,setOrders]=useState<readonly CustomOrder[]|null>(null); useEffect(()=>{if(!auth.claims?.studioId)return;void listStudioCustomOrders(auth.claims.studioId).then(setOrders).catch(()=>setOrders([]));},[auth.claims?.studioId]); if(auth.loading||!auth.user||!orders)return <LoadingSkeleton count={6}/>; return <AccountShell mode="seller" eyebrow="Bespoke production" title="Custom order studio"><div className="grid gap-4">{orders.length===0?<div className="rounded-[var(--radius-lg)] border border-border bg-white/70 p-10 text-center text-muted">No custom requests assigned to this Studio.</div>:orders.map((order)=><Link key={order.customOrderId} href={`/studio-admin/custom-orders/${order.customOrderId}`} className="rounded-[var(--radius-lg)] border border-border bg-white/72 p-6 shadow-[var(--shadow-card)]"><span className="text-xs uppercase tracking-[0.14em] text-muted">{order.status}</span><div className="mt-3 flex flex-wrap justify-between gap-4"><span className="font-heading text-2xl">{order.brief.title}</span><span>{order.customerName}</span></div></Link>)}</div></AccountShell>; }

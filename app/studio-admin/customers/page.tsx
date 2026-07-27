"use client";
import { AccountShell } from "@/components/account/AccountShell";
import { SellerGrowthManager } from "@/components/studio-admin/SellerGrowthManager";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
export default function Page(): React.JSX.Element { const auth=useRouteGuard({allowedRoles:["seller","founder","superAdmin"],requireStudioId:true}); if(auth.loading||!auth.user||!auth.claims?.studioId)return <LoadingSkeleton count={5}/>; return <AccountShell mode="seller" eyebrow="Customer intelligence" title="Segments"><SellerGrowthManager studioId={auth.claims.studioId} mode="segment"/></AccountShell>; }

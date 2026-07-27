"use client";
import { AccountShell } from "@/components/account/AccountShell";
import { ProductListManager } from "@/components/product-management/ProductListManager";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
export default function StudioProductsPage(): React.JSX.Element { const auth=useRouteGuard({allowedRoles:["seller","founder","superAdmin"],requireStudioId:true}); if(auth.loading||!auth.user||!auth.claims?.studioId)return <LoadingSkeleton count={6}/>; return <AccountShell mode="seller" eyebrow="Studio catalogue" title="Products"><ProductListManager studioId={auth.claims.studioId}/></AccountShell>; }

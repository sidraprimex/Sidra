"use client";
import { AccountShell } from "@/components/account/AccountShell";
import { NotificationCenter } from "@/components/customer/NotificationCenter";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
export default function SellerNotificationsPage(): React.JSX.Element { const auth=useRouteGuard({allowedRoles:["seller","founder","superAdmin"],requireStudioId:true}); if(auth.loading||!auth.user)return <LoadingSkeleton count={5}/>; return <AccountShell mode="seller" eyebrow="Paid orders and fulfilment alerts" title="Studio notifications"><NotificationCenter customerId={auth.user.uid}/></AccountShell>; }

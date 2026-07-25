"use client";
import { AccountShell } from "@/components/account/AccountShell";
import { SecuritySignalDashboard } from "@/components/admin/SecuritySignalDashboard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
export default function AdminSecurityPage(): React.JSX.Element { const auth = useRouteGuard({ allowedRoles: ["founder", "superAdmin"] }); if (auth.loading || !auth.user) return <LoadingSkeleton />; return <AccountShell eyebrow="Security operations" title="Signals require human judgment."><SecuritySignalDashboard /></AccountShell>; }

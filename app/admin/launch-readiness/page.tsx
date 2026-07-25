"use client";
import { AccountShell } from "@/components/account/AccountShell";
import { LaunchReadinessDashboard } from "@/components/admin/LaunchReadinessDashboard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useRouteGuard } from "@/hooks/useRouteGuard";
export default function LaunchReadinessPage(): React.JSX.Element { const auth = useRouteGuard({ allowedRoles: ["founder", "superAdmin"] }); if (auth.loading || !auth.user) return <LoadingSkeleton />; return <AccountShell eyebrow="Final release gate" title="Production readiness is evidence, not assumption."><LaunchReadinessDashboard /></AccountShell>; }

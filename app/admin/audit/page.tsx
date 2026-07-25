import { AdminAuditTable } from "@/components/admin/AdminAuditTable";
import { listAdminAuditLogs } from "@/services/founderAdminService";
import type { AdminAuditLog } from "@/types/phase10-founder-admin";
export default async function Page(): Promise<React.JSX.Element> {
  let entries: AdminAuditLog[] = []; try { entries = [...await listAdminAuditLogs()]; } catch {}
  return <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8"><header className="mb-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Founder governance history</p><h1 className="mt-3 font-heading text-5xl">Admin audit log</h1></header><AdminAuditTable entries={entries} /></main>;
}

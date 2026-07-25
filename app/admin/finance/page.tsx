import { FinanceLedgerTable } from "@/components/admin/FinanceLedgerTable";
import { listFinanceLedger } from "@/services/founderAdminService";
import type { FinanceLedgerEntry } from "@/types/phase10-founder-admin";
export default async function Page(): Promise<React.JSX.Element> {
  let entries: FinanceLedgerEntry[] = []; try { entries = [...await listFinanceLedger()]; } catch {}
  return <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8"><header className="mb-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Immutable financial trace</p><h1 className="mt-3 font-heading text-5xl">Finance ledger</h1></header><FinanceLedgerTable entries={entries} /></main>;
}

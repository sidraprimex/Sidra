import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type { AdminAuditLog, CommerceSettings, FinanceLedgerEntry, FounderControlCenterSummary, PlatformContentEntry } from "@/types/phase10-founder-admin";

export async function getFounderControlCenterSummary(): Promise<FounderControlCenterSummary> {
  const call = httpsCallable<Record<string, never>, FounderControlCenterSummary>(requireFirebaseServices().functions, "getFounderControlCenterSummary");
  return (await call({})).data;
}
export async function savePlatformContent(input: { contentId?: string; namespace: string; key: string; value: string; description: string; status: "draft" | "published" | "archived" }): Promise<{ contentId: string }> {
  const call = httpsCallable<typeof input, { contentId: string }>(requireFirebaseServices().functions, "savePlatformContent");
  return (await call(input)).data;
}
export async function saveCommerceSettings(input: CommerceSettings): Promise<void> {
  const call = httpsCallable<CommerceSettings, { accepted: true }>(requireFirebaseServices().functions, "saveCommerceSettings");
  await call(input);
}
export async function listPlatformContent(): Promise<readonly PlatformContentEntry[]> {
  const { db } = requireFirebaseServices();
  const snap = await getDocs(query(collection(db, "platformContent"), orderBy("namespace"), orderBy("key"), limit(500)));
  return snap.docs.map((d) => ({ contentId: d.id, ...d.data() } as PlatformContentEntry));
}
export async function listFinanceLedger(): Promise<readonly FinanceLedgerEntry[]> {
  const { db } = requireFirebaseServices();
  const snap = await getDocs(query(collection(db, "financeLedger"), orderBy("createdAt", "desc"), limit(500)));
  return snap.docs.map((d) => ({ ledgerEntryId: d.id, ...d.data() } as FinanceLedgerEntry));
}
export async function listAdminAuditLogs(): Promise<readonly AdminAuditLog[]> {
  const { db } = requireFirebaseServices();
  const snap = await getDocs(query(collection(db, "adminAuditLogs"), orderBy("createdAt", "desc"), limit(500)));
  return snap.docs.map((d) => ({ auditId: d.id, ...d.data() } as AdminAuditLog));
}

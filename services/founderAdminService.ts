import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { callVercelBackend } from "@/services/vercelBackendService";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type { AdminAuditLog, CommerceSettings, FinanceLedgerEntry, FounderControlCenterSummary, PlatformContentEntry } from "@/types/phase10-founder-admin";

export async function getFounderControlCenterSummary(): Promise<FounderControlCenterSummary> {
  return callVercelBackend("getFounderControlCenterSummary", {});
}
export async function savePlatformContent(input: { contentId?: string; namespace: string; key: string; value: string; description: string; status: "draft" | "published" | "archived" }): Promise<{ contentId: string }> {
  return callVercelBackend("savePlatformContent", input);
}
export async function saveCommerceSettings(input: CommerceSettings): Promise<void> {
  await callVercelBackend("saveCommerceSettings", input);
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

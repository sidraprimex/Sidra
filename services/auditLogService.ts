import { orderBy, where } from "firebase/firestore";
import { getDocumentById, listDocuments } from "@/services/firestoreRepository";
import type { AuditLog } from "@/types/audit-log";

export function getAuditLog(logId: string): Promise<AuditLog | null> {
  return getDocumentById<AuditLog>("auditLogs", logId);
}

export function listAuditLogs(maxResults = 100): Promise<readonly AuditLog[]> {
  return listDocuments<AuditLog>("auditLogs", [orderBy("timestamp", "desc")], maxResults);
}

export function listEntityAuditLogs(targetType: string, targetId: string, maxResults = 100): Promise<readonly AuditLog[]> {
  return listDocuments<AuditLog>("auditLogs", [where("targetType", "==", targetType), where("targetId", "==", targetId), orderBy("timestamp", "desc")], maxResults);
}

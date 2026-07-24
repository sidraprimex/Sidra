import { getFirestore, Timestamp } from "firebase-admin/firestore";

export interface AuditEntryInput {
  readonly actorUid: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly previousValue: unknown;
  readonly newValue: unknown;
  readonly ipAddress?: string | null;
  readonly userAgent?: string | null;
}

export async function writeAuditLog(input: AuditEntryInput): Promise<string> {
  const reference = getFirestore().collection("auditLogs").doc();
  await reference.set({
    logId: reference.id,
    actorUid: input.actorUid,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    previousValue: input.previousValue,
    newValue: input.newValue,
    timestamp: Timestamp.now(),
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  });
  return reference.id;
}

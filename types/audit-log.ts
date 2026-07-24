import type { DateTimeValue } from "@/types/firestore";

export interface AuditLog {
  readonly logId: string;
  readonly actorUid: string;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly previousValue: unknown;
  readonly newValue: unknown;
  readonly timestamp: DateTimeValue;
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
}

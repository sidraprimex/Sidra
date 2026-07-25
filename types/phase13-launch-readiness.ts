import type { DateTimeValue } from "@/types/firestore";

export type SecuritySignalType = "failedLoginBurst" | "rapidAccountCreation" | "excessiveRefunds" | "duplicateSellerApplication";
export type SecuritySignalStatus = "open" | "reviewing" | "dismissed" | "confirmed";
export type ReleaseEvidenceStatus = "notRun" | "running" | "passed" | "failed" | "blocked";
export type ReleaseGateKey = "authFlows" | "securityRules" | "customerJourney" | "sellerProvisioning" | "webhookForgery" | "performanceBudgets" | "bugGate" | "recentBackup" | "rbacMatrix" | "loadTest";

export interface Phase13SecuritySignal {
  readonly signalId: string;
  readonly type: SecuritySignalType;
  readonly status: SecuritySignalStatus;
  readonly subjectUid: string | null;
  readonly subjectStudioId: string | null;
  readonly fingerprintHash: string | null;
  readonly occurrenceCount: number;
  readonly summary: string;
  readonly evidence: Readonly<Record<string, string | number | boolean | null>>;
  readonly firstObservedAt: DateTimeValue;
  readonly lastObservedAt: DateTimeValue;
  readonly reviewedByUid: string | null;
  readonly reviewedAt: DateTimeValue;
  readonly autoActionTaken: false;
}

export interface ReleaseEvidence {
  readonly evidenceId: ReleaseGateKey;
  readonly status: ReleaseEvidenceStatus;
  readonly summary: string;
  readonly method: string;
  readonly artifactUrl: string | null;
  readonly measuredValue: number | null;
  readonly targetValue: number | null;
  readonly unit: string | null;
  readonly executedAt: DateTimeValue;
  readonly executedByUid: string | null;
  readonly notes: string | null;
}

export interface LaunchReadinessSummary {
  readonly openSignals: number;
  readonly unresolvedCriticalBugs: number;
  readonly latestBackupStatus: ReleaseEvidenceStatus;
  readonly passedGates: number;
  readonly totalGates: number;
  readonly readyForProduction: boolean;
  readonly evidence: readonly ReleaseEvidence[];
}

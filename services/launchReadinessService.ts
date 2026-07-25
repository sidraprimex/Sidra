import { orderBy, where } from "firebase/firestore";
import { callSidraFunction } from "@/services/functionService";
import { listDocuments } from "@/services/firestoreRepository";
import type { LaunchReadinessSummary, Phase13SecuritySignal, ReleaseEvidence, ReleaseGateKey, ReleaseEvidenceStatus, SecuritySignalStatus } from "@/types/phase13-launch-readiness";

export function getLaunchReadinessSummary(): Promise<LaunchReadinessSummary> { return callSidraFunction("getLaunchReadinessSummary", {}); }
export function reviewSecuritySignal(signalId: string, status: SecuritySignalStatus): Promise<{ updated: boolean }> { return callSidraFunction("reviewSecuritySignal", { signalId, status }); }
export function saveReleaseEvidence(input: { evidenceId: ReleaseGateKey; status: ReleaseEvidenceStatus; summary: string; method: string; artifactUrl?: string; measuredValue?: number; targetValue?: number; unit?: string; notes?: string }): Promise<{ updated: boolean }> { return callSidraFunction("saveReleaseEvidence", input); }
export function listOpenSecuritySignals(maxResults = 100): Promise<readonly Phase13SecuritySignal[]> { return listDocuments("securitySignals", [where("status", "in", ["open", "reviewing"]), orderBy("lastObservedAt", "desc")], maxResults); }
export function listReleaseEvidence(maxResults = 50): Promise<readonly ReleaseEvidence[]> { return listDocuments("releaseEvidence", [orderBy("evidenceId", "asc")], maxResults); }

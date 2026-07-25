import { createHash } from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { cleanEvidenceText, isReleaseGate, isReleaseStatus, isSecurityStatus, RELEASE_GATES, releaseIsReady } from "./launchReadinessPolicy.js";

function requireFounder(request: { auth?: { uid: string; token: Record<string, unknown> } }): string {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Sign in is required.");
  const role = String(request.auth.token.role ?? "customer");
  if (!["founder", "superAdmin"].includes(role)) throw new HttpsError("permission-denied", "Founder access required.");
  return request.auth.uid;
}
function optionalNumber(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }

export const recordSecuritySignal = onCall(async (request) => {
  const type = cleanEvidenceText(request.data?.type, 64);
  if (!["failedLoginBurst", "rapidAccountCreation", "excessiveRefunds", "duplicateSellerApplication"].includes(type)) throw new HttpsError("invalid-argument", "Unknown security signal.");
  const subjectUid = cleanEvidenceText(request.data?.subjectUid, 128) || null;
  const fingerprint = cleanEvidenceText(request.data?.fingerprint, 512);
  const fingerprintHash = fingerprint ? createHash("sha256").update(fingerprint).digest("hex") : null;
  const db = getFirestore();
  const stableKey = createHash("sha256").update(`${type}:${subjectUid ?? "anonymous"}:${fingerprintHash ?? "none"}`).digest("hex");
  const ref = db.collection("securitySignals").doc(stableKey);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref); const current = snap.data();
    tx.set(ref, { signalId: stableKey, type, status: current?.status === "dismissed" ? "open" : current?.status ?? "open", subjectUid, subjectStudioId: cleanEvidenceText(request.data?.subjectStudioId, 128) || null, fingerprintHash, occurrenceCount: Number(current?.occurrenceCount ?? 0) + 1, summary: cleanEvidenceText(request.data?.summary, 240) || type, evidence: typeof request.data?.evidence === "object" && request.data.evidence ? request.data.evidence : {}, firstObservedAt: current?.firstObservedAt ?? FieldValue.serverTimestamp(), lastObservedAt: FieldValue.serverTimestamp(), reviewedByUid: null, reviewedAt: null, autoActionTaken: false }, { merge: true });
  });
  return { recorded: true };
});

export const reviewSecuritySignal = onCall(async (request) => {
  const uid = requireFounder(request); const signalId = cleanEvidenceText(request.data?.signalId, 128); const status = cleanEvidenceText(request.data?.status, 32);
  if (!signalId || !isSecurityStatus(status)) throw new HttpsError("invalid-argument", "Valid signal and status are required.");
  const ref = getFirestore().collection("securitySignals").doc(signalId); const snap = await ref.get(); if (!snap.exists) throw new HttpsError("not-found", "Signal not found.");
  await ref.update({ status, reviewedByUid: uid, reviewedAt: FieldValue.serverTimestamp(), autoActionTaken: false }); return { updated: true };
});

export const saveReleaseEvidence = onCall(async (request) => {
  const uid = requireFounder(request); const evidenceId = cleanEvidenceText(request.data?.evidenceId, 64); const status = cleanEvidenceText(request.data?.status, 32);
  if (!isReleaseGate(evidenceId) || !isReleaseStatus(status)) throw new HttpsError("invalid-argument", "Valid release gate evidence is required.");
  await getFirestore().collection("releaseEvidence").doc(evidenceId).set({ evidenceId, status, summary: cleanEvidenceText(request.data?.summary, 500), method: cleanEvidenceText(request.data?.method, 300), artifactUrl: cleanEvidenceText(request.data?.artifactUrl, 1000) || null, measuredValue: optionalNumber(request.data?.measuredValue), targetValue: optionalNumber(request.data?.targetValue), unit: cleanEvidenceText(request.data?.unit, 32) || null, notes: cleanEvidenceText(request.data?.notes, 2000) || null, executedAt: FieldValue.serverTimestamp(), executedByUid: uid }, { merge: true });
  return { updated: true };
});

export const getLaunchReadinessSummary = onCall(async (request) => {
  requireFounder(request); const db = getFirestore();
  const [evidenceSnap, signalsSnap, bugsSnap] = await Promise.all([db.collection("releaseEvidence").get(), db.collection("securitySignals").where("status", "in", ["open", "reviewing"]).get(), db.collection("releaseBugs").where("severity", "in", ["critical", "high"]).where("status", "!=", "closed").get()]);
  const byId = new Map(evidenceSnap.docs.map((doc) => [doc.id, doc.data()]));
  const evidence = RELEASE_GATES.map((evidenceId) => ({ evidenceId, status: byId.get(evidenceId)?.status ?? "notRun", summary: byId.get(evidenceId)?.summary ?? "", method: byId.get(evidenceId)?.method ?? "", artifactUrl: byId.get(evidenceId)?.artifactUrl ?? null, measuredValue: byId.get(evidenceId)?.measuredValue ?? null, targetValue: byId.get(evidenceId)?.targetValue ?? null, unit: byId.get(evidenceId)?.unit ?? null, executedAt: byId.get(evidenceId)?.executedAt ?? null, executedByUid: byId.get(evidenceId)?.executedByUid ?? null, notes: byId.get(evidenceId)?.notes ?? null }));
  const statuses = evidence.map((item) => String(item.status));
  return { openSignals: signalsSnap.size, unresolvedCriticalBugs: bugsSnap.size, latestBackupStatus: String(byId.get("recentBackup")?.status ?? "notRun"), passedGates: statuses.filter((status) => status === "passed").length, totalGates: RELEASE_GATES.length, readyForProduction: releaseIsReady(statuses, signalsSnap.size, bugsSnap.size), evidence };
});

import { onSchedule } from "firebase-functions/v2/scheduler";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const CRITICAL_COLLECTIONS = ["users", "studios", "products", "orders", "payments", "customOrders", "reviews", "supportTickets", "auditLogs"] as const;

export const verifyDailyBackupInventory = onSchedule({ schedule: "every day 02:00", timeZone: "Asia/Kolkata", timeoutSeconds: 540, memory: "512MiB" }, async () => {
  const db = getFirestore(); const bucket = getStorage().bucket();
  const collectionCounts: Record<string, number> = {};
  for (const name of CRITICAL_COLLECTIONS) { const aggregate = await db.collection(name).count().get(); collectionCounts[name] = aggregate.data().count; }
  const [files] = await bucket.getFiles({ autoPaginate: false, maxResults: 1000 });
  const backupRef = db.collection("backupRuns").doc();
  await backupRef.set({ backupRunId: backupRef.id, status: "inventoryVerified", collectionCounts, sampledStorageObjects: files.length, bucketName: bucket.name, startedAt: FieldValue.serverTimestamp(), completedAt: FieldValue.serverTimestamp(), restoreDrillStatus: "notRun", note: "This verifies source inventory. A real managed export and restore drill must be executed against the staging/test GCP project using scripts/release/backup-restore-drill.sh." });
});

export const purgeExpiredSoftDeletedAccounts = onSchedule({ schedule: "every day 03:00", timeZone: "Asia/Kolkata", timeoutSeconds: 540 }, async () => {
  const db = getFirestore(); const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); const snap = await db.collection("users").where("deletionStatus", "==", "scheduled").where("deletionRequestedAt", "<=", cutoff).limit(200).get();
  const batch = db.batch(); snap.docs.forEach((doc) => batch.update(doc.ref, { deletionStatus: "purged", purgedAt: FieldValue.serverTimestamp(), displayName: "Deleted account", email: null, phone: null, profilePhoto: null })); await batch.commit();
});

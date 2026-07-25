import { onSchedule } from "firebase-functions/v2/scheduler";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";

export const monitorPaymentWebhookFailures = onSchedule({ schedule: "every 1 hours", timeZone: "Asia/Kolkata" }, async () => {
  const db = getFirestore(); const since = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);
  const [failed, total] = await Promise.all([db.collection("paymentWebhookEvents").where("createdAt", ">=", since).where("status", "==", "failed").count().get(), db.collection("paymentWebhookEvents").where("createdAt", ">=", since).count().get()]);
  const failedCount = failed.data().count; const totalCount = total.data().count; const failureRate = totalCount === 0 ? 0 : failedCount / totalCount;
  if (totalCount >= 5 && failureRate >= 0.1) await db.collection("notifications").add({ recipientRole: "founder", type: "paymentWebhookHealthAlert", title: "Payment webhook failures require review", body: `${failedCount} of ${totalCount} webhook events failed in the last hour.`, read: false, severity: "high", metadata: { failedCount, totalCount, failureRate }, createdAt: FieldValue.serverTimestamp() });
});

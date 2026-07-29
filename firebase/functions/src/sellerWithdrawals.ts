import { randomUUID } from "node:crypto";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

const activeWithdrawalStatuses = ["pending", "processing", "paid"] as const;
const adminRoles = new Set(["admin", "founder", "superAdmin", "financeManager"]);

export const requestSellerWithdrawal = onCall(async (request) => {
  const uid = request.auth?.uid;
  const studioId = typeof request.auth?.token.studioId === "string" ? request.auth.token.studioId : "";
  if (!uid || !studioId) throw new HttpsError("permission-denied", "Approved seller access required.");

  const amountPaise = Math.round(Number(request.data?.amountPaise ?? 0));
  const method = String(request.data?.method ?? "");
  const destination = request.data?.destination ?? {};
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 50000) throw new HttpsError("invalid-argument", "Minimum withdrawal is ₹500.");
  if (!["upi", "bank", "imps"].includes(method)) throw new HttpsError("invalid-argument", "Choose UPI, bank transfer or IMPS.");
  if (method === "upi" && !/^[\w.-]{2,}@[A-Za-z]{2,}$/.test(String(destination.upiId ?? "").trim())) throw new HttpsError("invalid-argument", "Enter a valid UPI ID.");
  if (method !== "upi") {
    if (String(destination.accountHolderName ?? "").trim().length < 2 || !/^\d{6,20}$/.test(String(destination.accountNumber ?? "").trim()) || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(destination.ifsc ?? "").trim().toUpperCase())) {
      throw new HttpsError("invalid-argument", "Complete valid bank details are required.");
    }
  }

  const db = getFirestore();
  const availableSnapshot = await db.collection("payouts").where("studioId", "==", studioId).where("status", "==", "available").get();
  const withdrawalsSnapshot = await db.collection("sellerWithdrawals").where("studioId", "==", studioId).where("status", "in", [...activeWithdrawalStatuses]).get();
  const availablePaise = availableSnapshot.docs.reduce((sum, item) => sum + Math.max(0, Number(item.data().sellerAmountPaise ?? 0)), 0);
  const reservedPaise = withdrawalsSnapshot.docs.reduce((sum, item) => sum + Math.max(0, Number(item.data().amountPaise ?? 0)), 0);
  if (amountPaise > availablePaise - reservedPaise) throw new HttpsError("failed-precondition", "Withdrawal amount exceeds available wallet balance.");

  const ref = db.collection("sellerWithdrawals").doc(randomUUID());
  await ref.create({
    withdrawalId: ref.id, studioId, sellerUid: uid, amountPaise, method,
    destination: method === "upi"
      ? { upiId: String(destination.upiId).trim().toLowerCase() }
      : {
          accountHolderName: String(destination.accountHolderName).trim(),
          accountNumber: String(destination.accountNumber).trim(),
          ifsc: String(destination.ifsc).trim().toUpperCase(),
          bankName: String(destination.bankName ?? "").trim(),
        },
    status: "pending", paymentReference: null, adminNote: null,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  });
  return { withdrawalId: ref.id };
});

export const reviewSellerWithdrawal = onCall(async (request) => {
  const uid = request.auth?.uid;
  const role = String(request.auth?.token.role ?? "");
  if (!uid || !adminRoles.has(role)) throw new HttpsError("permission-denied", "Finance admin access required.");
  const withdrawalId = String(request.data?.withdrawalId ?? "");
  const decision = String(request.data?.decision ?? "");
  const paymentReference = String(request.data?.paymentReference ?? "").trim();
  const adminNote = String(request.data?.adminNote ?? "").trim();
  if (!withdrawalId || !["processing", "paid", "rejected"].includes(decision)) throw new HttpsError("invalid-argument", "Valid withdrawal decision required.");
  if (decision === "paid" && paymentReference.length < 4) throw new HttpsError("invalid-argument", "UTR or payment reference is required.");
  if (decision === "rejected" && adminNote.length < 3) throw new HttpsError("invalid-argument", "Rejection reason is required.");

  const db = getFirestore();
  const ref = db.collection("sellerWithdrawals").doc(withdrawalId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new HttpsError("not-found", "Withdrawal request not found.");
    const current = String(snapshot.data()?.status ?? "");
    if (["paid", "rejected"].includes(current)) throw new HttpsError("failed-precondition", "Withdrawal is already closed.");
    transaction.update(ref, {
      status: decision, paymentReference: decision === "paid" ? paymentReference : null,
      adminNote: adminNote || null, reviewedBy: uid,
      reviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.create(db.collection("notifications").doc(), {
      recipientUid: snapshot.data()?.sellerUid, studioId: snapshot.data()?.studioId,
      type: "sellerWithdrawal", title: `Withdrawal ${decision}`,
      body: decision === "paid" ? `₹${Number(snapshot.data()?.amountPaise ?? 0) / 100} paid. Reference: ${paymentReference}` : adminNote || `Withdrawal marked ${decision}.`,
      actionUrl: "/studio-admin/payouts", read: false, createdAt: FieldValue.serverTimestamp(),
    });
    transaction.create(db.collection("adminAuditLogs").doc(), {
      action: `withdrawal.${decision}`, actorUid: uid, actorRole: role,
      entityType: "sellerWithdrawals", entityId: withdrawalId,
      summary: `Withdrawal ${withdrawalId} marked ${decision}`, createdAt: FieldValue.serverTimestamp(),
    });
  });
  return { accepted: true };
});

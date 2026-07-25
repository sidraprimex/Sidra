import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");

export const requestOrderRefund = onCall({ secrets: [razorpayKeyId, razorpayKeySecret] }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required.");
  const orderId = String(request.data?.orderId ?? "");
  const amountPaise = Number(request.data?.amountPaise ?? 0);
  const reason = String(request.data?.reason ?? "").trim();
  const evidenceUrls = Array.isArray(request.data?.evidenceUrls) ? request.data.evidenceUrls : [];
  if (!orderId || !Number.isInteger(amountPaise) || amountPaise <= 0 || reason.length < 4) throw new HttpsError("invalid-argument", "Valid refund details are required.");

  const db = getFirestore();
  const orderRef = db.collection("orders").doc(orderId);
  const orderSnapshot = await orderRef.get();
  if (!orderSnapshot.exists) throw new HttpsError("not-found", "Order not found.");
  const order = orderSnapshot.data() ?? {};
  const role = String(request.auth.token.role ?? "customer");
  const isOwner = order.customerId === request.auth.uid;
  const isFounder = role === "founder" || role === "superAdmin";
  if (!isOwner && !isFounder) throw new HttpsError("permission-denied", "Refund access denied.");

  const postProduction = ["inProduction", "qualityCheck", "packaged", "readyToShip", "shipped", "inTransit", "outForDelivery", "delivered", "completed"].includes(String(order.orderStatus));
  if (postProduction && !isFounder) {
    await db.collection("refundRequests").add({
      orderId,
      customerId: request.auth.uid,
      amountPaise,
      reason,
      evidenceUrls,
      status: "founderReview",
      createdAt: FieldValue.serverTimestamp(),
    });
    await orderRef.update({ orderStatus: "refundRequested", paymentStatus: "refundPending", updatedAt: FieldValue.serverTimestamp() });
    return { accepted: true };
  }

  const payments = await db.collection("payments").where("orderId", "==", orderId).limit(1).get();
  if (payments.empty) throw new HttpsError("failed-precondition", "Captured payment not found.");
  const payment = payments.docs[0].data();
  const credentials = Buffer.from(`${razorpayKeyId.value()}:${razorpayKeySecret.value()}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/payments/${payment.gatewayPaymentId}/refund`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, notes: { orderId, reason } }),
  });
  if (!response.ok) throw new HttpsError("internal", "Gateway refund failed.");
  const refund = await response.json() as { id: string };

  await db.runTransaction(async (transaction) => {
    transaction.update(orderRef, { orderStatus: "refunded", paymentStatus: amountPaise === Number(order.totalPaise) ? "refunded" : "partiallyRefunded", updatedAt: FieldValue.serverTimestamp() });
    transaction.update(payments.docs[0].ref, { refundId: refund.id, refundAmountPaise: amountPaise, status: "refunded", updatedAt: FieldValue.serverTimestamp() });
    transaction.create(db.collection("auditLogs").doc(), {
      action: "refundProcessed",
      actorId: request.auth?.uid,
      entityType: "order",
      entityId: orderId,
      before: { paymentStatus: order.paymentStatus },
      after: { paymentStatus: "refunded", amountPaise },
      reason,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
  return { accepted: true };
});

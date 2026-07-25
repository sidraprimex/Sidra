import crypto from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");

export const acceptCustomOrderQuote = onCall({ secrets: [razorpayKeyId, razorpayKeySecret] }, async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required.");
  const customOrderId = String(request.data?.customOrderId ?? "");
  if (!customOrderId) throw new HttpsError("invalid-argument", "Custom order is required.");

  const db = getFirestore();
  const customOrderRef = db.collection("customOrders").doc(customOrderId);
  const snapshot = await customOrderRef.get();
  if (!snapshot.exists) throw new HttpsError("not-found", "Custom order not found.");
  const order = snapshot.data() ?? {};
  if (order.customerId !== request.auth.uid) throw new HttpsError("permission-denied", "Only the customer can accept this quote.");
  if (order.status !== "quoteSent" || !order.quote) throw new HttpsError("failed-precondition", "No active quote is available.");
  if (new Date(String(order.quote.expiresAt)).getTime() < Date.now()) throw new HttpsError("failed-precondition", "Quote has expired.");

  const checkoutReference = crypto.randomUUID();
  const credentials = Buffer.from(`${razorpayKeyId.value()}:${razorpayKeySecret.value()}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Number(order.quote.totalPaise),
      currency: "INR",
      receipt: checkoutReference,
      notes: { customOrderId },
    }),
  });
  if (!response.ok) throw new HttpsError("internal", "Payment session could not be created.");
  const gatewayOrder = await response.json() as { id: string };

  await db.runTransaction(async (transaction) => {
    transaction.update(customOrderRef, {
      status: "paymentPending",
      "quote.acceptedAt": new Date().toISOString(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.create(db.collection("paymentSessions").doc(checkoutReference), {
      customerId: request.auth?.uid,
      gatewayOrderId: gatewayOrder.id,
      customOrderId,
      amountPaise: Number(order.quote.totalPaise),
      currency: "INR",
      status: "initiated",
      type: "customOrder",
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { checkoutReference };
});

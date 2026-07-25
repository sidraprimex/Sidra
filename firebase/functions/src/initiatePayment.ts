import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import crypto from "node:crypto";

const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");

export const initiatePayment = onCall({ secrets: [razorpayKeyId, razorpayKeySecret] }, async (request) => {
  if (!request.auth?.uid || request.auth.token.email_verified !== true) {
    throw new HttpsError("unauthenticated", "Verified account required.");
  }
  const checkout = request.data?.checkout;
  if (!checkout || !Array.isArray(checkout.items) || checkout.items.length === 0) {
    throw new HttpsError("invalid-argument", "A non-empty checkout is required.");
  }
  const amountPaise = Number(checkout.totalPaise);
  if (!Number.isInteger(amountPaise) || amountPaise <= 0) throw new HttpsError("invalid-argument", "Invalid amount.");
  const checkoutReference = crypto.randomUUID();
  const credentials = Buffer.from(`${razorpayKeyId.value()}:${razorpayKeySecret.value()}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: checkoutReference }),
  });
  if (!response.ok) throw new HttpsError("internal", "Payment session could not be created.");
  const gatewayOrder = await response.json() as { id: string };
  await getFirestore().collection("paymentSessions").doc(checkoutReference).set({
    customerId: request.auth.uid,
    gatewayOrderId: gatewayOrder.id,
    checkout,
    status: "initiated",
    createdAt: FieldValue.serverTimestamp(),
  });
  return {
    gatewayOrderId: gatewayOrder.id,
    publicKey: razorpayKeyId.value(),
    amountPaise,
    currency: "INR",
    checkoutReference,
  };
});

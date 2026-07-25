import crypto from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

export const submitCustomOrder = onCall(async (request) => {
  if (!request.auth?.uid || request.auth.token.email_verified !== true) {
    throw new HttpsError("unauthenticated", "Verified customer account required.");
  }
  const studioId = String(request.data?.studioId ?? "");
  const brief = request.data?.brief as Record<string, unknown> | undefined;
  if (!studioId || !brief) throw new HttpsError("invalid-argument", "Studio and brief are required.");
  if (String(brief.title ?? "").trim().length < 3) throw new HttpsError("invalid-argument", "Project title is required.");
  if (String(brief.description ?? "").trim().length < 40) throw new HttpsError("invalid-argument", "A detailed brief is required.");
  if (String(brief.targetDeliveryDate ?? "").length < 8) throw new HttpsError("invalid-argument", "Target delivery date is required.");

  const db = getFirestore();
  const studioSnapshot = await db.collection("studios").doc(studioId).get();
  if (!studioSnapshot.exists || studioSnapshot.data()?.status !== "active") {
    throw new HttpsError("failed-precondition", "Studio is not accepting custom orders.");
  }

  const customerSnapshot = await db.collection("users").doc(request.auth.uid).get();
  const customOrderRef = db.collection("customOrders").doc();
  await customOrderRef.set({
    customerId: request.auth.uid,
    customerName: String(customerSnapshot.data()?.displayName ?? request.auth.token.name ?? "Customer"),
    studioId,
    studioName: String(studioSnapshot.data()?.name ?? "Studio"),
    status: "submitted",
    brief,
    quote: null,
    messages: [],
    proofs: [],
    linkedOrderId: null,
    timeline: [{
      id: crypto.randomUUID(),
      status: "submitted",
      actorId: request.auth.uid,
      actorRole: "customer",
      createdAt: new Date().toISOString(),
    }],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await db.collection("notifications").add({
    audience: "studio",
    studioId,
    type: "customOrderSubmitted",
    customOrderId: customOrderRef.id,
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { customOrderId: customOrderRef.id };
});

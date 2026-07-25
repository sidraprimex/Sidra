import crypto from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function requireRole(request: { auth?: { uid: string; token: Record<string, unknown> } }, roles: readonly string[]): { uid: string; role: string; studioId: string | null } {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required.");
  const role = String(request.auth.token.role ?? "customer");
  if (!roles.includes(role)) throw new HttpsError("permission-denied", "Role is not permitted.");
  return { uid: request.auth.uid, role, studioId: typeof request.auth.token.studioId === "string" ? request.auth.token.studioId : null };
}

export const sendCustomOrderQuote = onCall(async (request) => {
  const actor = requireRole(request, ["seller"]);
  const customOrderId = String(request.data?.customOrderId ?? "");
  const pricePaise = Number(request.data?.pricePaise ?? 0);
  const shippingPaise = Number(request.data?.shippingPaise ?? 0);
  const productionDays = Number(request.data?.productionDays ?? 0);
  const revisionLimit = Number(request.data?.revisionLimit ?? 0);
  const expiresAt = String(request.data?.expiresAt ?? "");
  const terms = String(request.data?.terms ?? "").trim();
  if (!customOrderId || !Number.isInteger(pricePaise) || pricePaise <= 0 || shippingPaise < 0 || productionDays <= 0 || revisionLimit < 0 || terms.length < 20 || expiresAt.length < 8) {
    throw new HttpsError("invalid-argument", "Complete quote details are required.");
  }

  const db = getFirestore();
  const ref = db.collection("customOrders").doc(customOrderId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new HttpsError("not-found", "Custom order not found.");
    const order = snapshot.data() ?? {};
    if (actor.studioId !== order.studioId) throw new HttpsError("permission-denied", "Request does not belong to this Studio.");
    if (!["sellerReview", "clarificationRequested", "submitted"].includes(String(order.status))) {
      throw new HttpsError("failed-precondition", "Quote cannot be sent in the current state.");
    }
    const quote = {
      quoteId: crypto.randomUUID(),
      pricePaise,
      shippingPaise,
      totalPaise: pricePaise + shippingPaise,
      productionDays,
      revisionLimit,
      expiresAt,
      terms,
      createdAt: new Date().toISOString(),
      acceptedAt: null,
    };
    transaction.update(ref, {
      status: "quoteSent",
      quote,
      updatedAt: FieldValue.serverTimestamp(),
      timeline: FieldValue.arrayUnion({
        id: crypto.randomUUID(),
        status: "quoteSent",
        actorId: actor.uid,
        actorRole: actor.role,
        createdAt: new Date().toISOString(),
      }),
    });
  });
  return { accepted: true };
});

export const sendCustomOrderMessage = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required.");
  const customOrderId = String(request.data?.customOrderId ?? "");
  const body = String(request.data?.body ?? "").trim();
  const attachmentUrls = Array.isArray(request.data?.attachmentUrls) ? request.data.attachmentUrls : [];
  if (!customOrderId || body.length < 1 || body.length > 5000) throw new HttpsError("invalid-argument", "Valid message required.");

  const db = getFirestore();
  const ref = db.collection("customOrders").doc(customOrderId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new HttpsError("not-found", "Custom order not found.");
    const order = snapshot.data() ?? {};
    const role = String(request.auth?.token.role ?? "customer");
    const studioId = typeof request.auth?.token.studioId === "string" ? request.auth.token.studioId : null;
    const allowed = order.customerId === request.auth?.uid || (role === "seller" && order.studioId === studioId) || role === "founder" || role === "support";
    if (!allowed) throw new HttpsError("permission-denied", "Conversation access denied.");
    transaction.update(ref, {
      messages: FieldValue.arrayUnion({
        messageId: crypto.randomUUID(),
        senderId: request.auth?.uid,
        senderRole: role,
        body,
        attachmentUrls,
        createdAt: new Date().toISOString(),
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return { accepted: true };
});

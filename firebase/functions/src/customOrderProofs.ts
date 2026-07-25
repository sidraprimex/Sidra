import crypto from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

export const submitCustomOrderProof = onCall(async (request) => {
  if (!request.auth?.uid || request.auth.token.role !== "seller") throw new HttpsError("permission-denied", "Seller access required.");
  const studioId = typeof request.auth.token.studioId === "string" ? request.auth.token.studioId : null;
  const customOrderId = String(request.data?.customOrderId ?? "");
  const imageUrls = Array.isArray(request.data?.imageUrls) ? request.data.imageUrls : [];
  const note = String(request.data?.note ?? "").trim();
  if (!customOrderId || imageUrls.length === 0 || note.length < 10) throw new HttpsError("invalid-argument", "Proof images and note are required.");

  const db = getFirestore();
  const ref = db.collection("customOrders").doc(customOrderId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new HttpsError("not-found", "Custom order not found.");
    const order = snapshot.data() ?? {};
    if (order.studioId !== studioId) throw new HttpsError("permission-denied", "Request does not belong to this Studio.");
    if (!["inProduction", "revisionRequested"].includes(String(order.status))) throw new HttpsError("failed-precondition", "Proof cannot be submitted now.");
    const revisionNumber = Array.isArray(order.proofs) ? order.proofs.length + 1 : 1;
    transaction.update(ref, {
      status: "proofReady",
      proofs: FieldValue.arrayUnion({
        proofId: crypto.randomUUID(),
        imageUrls,
        note,
        revisionNumber,
        status: "pendingApproval",
        createdAt: new Date().toISOString(),
        reviewedAt: null,
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return { accepted: true };
});

export const reviewCustomOrderProof = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required.");
  const customOrderId = String(request.data?.customOrderId ?? "");
  const proofId = String(request.data?.proofId ?? "");
  const decision = String(request.data?.decision ?? "");
  const reason = String(request.data?.reason ?? "").trim();
  if (!customOrderId || !proofId || !["approve", "requestRevision"].includes(decision)) throw new HttpsError("invalid-argument", "Valid proof decision required.");
  if (decision === "requestRevision" && reason.length < 8) throw new HttpsError("invalid-argument", "Revision reason is required.");

  const db = getFirestore();
  const ref = db.collection("customOrders").doc(customOrderId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) throw new HttpsError("not-found", "Custom order not found.");
    const order = snapshot.data() ?? {};
    if (order.customerId !== request.auth?.uid) throw new HttpsError("permission-denied", "Only the customer can review proof.");
    if (order.status !== "proofReady") throw new HttpsError("failed-precondition", "Proof is not awaiting review.");
    const proofs = Array.isArray(order.proofs) ? [...order.proofs] : [];
    const index = proofs.findIndex((item: Record<string, unknown>) => item.proofId === proofId);
    if (index < 0) throw new HttpsError("not-found", "Proof not found.");
    proofs[index] = {
      ...proofs[index],
      status: decision === "approve" ? "approved" : "revisionRequested",
      reviewedAt: new Date().toISOString(),
      reviewReason: reason || null,
    };
    transaction.update(ref, {
      status: decision === "approve" ? "approved" : "revisionRequested",
      proofs,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return { accepted: true };
});

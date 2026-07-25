import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const moderateProduct = onCall(async (request) => {
  const role = request.auth?.token.role;
  if (role !== "founder" && role !== "superAdmin") throw new HttpsError("permission-denied", "Founder access required.");
  const productId = typeof request.data?.productId === "string" ? request.data.productId : "";
  const action = request.data?.action;
  if (!productId || !["approve", "suspend"].includes(action)) throw new HttpsError("invalid-argument", "Invalid moderation request.");
  const reference = getFirestore().collection("products").doc(productId);
  const snapshot = await reference.get();
  if (!snapshot.exists) throw new HttpsError("not-found", "Product not found.");
  await reference.update({
    status: action === "approve" ? "published" : "suspended",
    approvedAt: action === "approve" ? FieldValue.serverTimestamp() : null,
    publishedAt: action === "approve" ? FieldValue.serverTimestamp() : null,
    moderationReason: action === "suspend" ? String(request.data?.reason ?? "") : null,
    reviewedBy: request.auth?.uid,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { ok: true };
});

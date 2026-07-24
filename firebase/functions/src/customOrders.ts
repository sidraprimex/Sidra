import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { writeAuditLog } from "./audit.js";

function text(value: unknown, name: string, min: number, max: number): string {
  if (typeof value !== "string") throw new HttpsError("invalid-argument", `${name} is required.`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) throw new HttpsError("invalid-argument", `${name} is invalid.`);
  return normalized;
}

export const createCustomOrderRequest = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in is required.");
  if (request.auth.token.email_verified !== true) throw new HttpsError("failed-precondition", "Verify your email first.");

  const category = text(request.data?.category, "category", 2, 120);
  const description = text(request.data?.description, "description", 20, 5000);
  const budgetRange = request.data?.budgetRange;
  if (!budgetRange || typeof budgetRange.minimum !== "number" || typeof budgetRange.maximum !== "number" || budgetRange.minimum < 0 || budgetRange.maximum < budgetRange.minimum) {
    throw new HttpsError("invalid-argument", "budgetRange is invalid.");
  }
  const referenceImageUrls = Array.isArray(request.data?.referenceImageUrls)
    ? request.data.referenceImageUrls.filter((value: unknown): value is string => typeof value === "string").slice(0, 10)
    : [];
  let deadline: Timestamp | null = null;
  if (typeof request.data?.deadline === "string" && request.data.deadline.length > 0) {
    const deadlineDate = new Date(request.data.deadline);
    if (Number.isNaN(deadlineDate.getTime())) throw new HttpsError("invalid-argument", "deadline is invalid.");
    deadline = Timestamp.fromDate(deadlineDate);
  }

  const db = getFirestore();
  const reference = db.collection("customOrders").doc();
  const now = Timestamp.now();
  await reference.set({
    requestId: reference.id,
    customerId: request.auth.uid,
    assignedStudioId: null,
    category,
    description,
    budgetRange: { minimum: budgetRange.minimum, maximum: budgetRange.maximum },
    deadline,
    referenceImageUrls,
    conversationId: null,
    quotedPrice: null,
    acceptedPrice: null,
    status: "submitted",
    paymentId: null,
    revisionCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  await writeAuditLog({
    actorUid: request.auth.uid,
    action: "customOrder.created",
    targetType: "customOrder",
    targetId: reference.id,
    previousValue: null,
    newValue: { status: "submitted", category },
    ipAddress: request.rawRequest.ip ?? null,
    userAgent: request.rawRequest.get("user-agent") ?? null,
  });

  return { requestId: reference.id };
});

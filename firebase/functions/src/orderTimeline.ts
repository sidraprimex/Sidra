import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { writeAuditLog } from "./audit.js";

const ORDER_STATUSES = [
  "placed", "accepted", "inProduction", "qualityCheck", "packaged",
  "readyToShip", "shipped", "inTransit", "outForDelivery", "delivered",
  "completed", "cancelled", "returned",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  placed: ["accepted", "cancelled"],
  accepted: ["inProduction", "cancelled"],
  inProduction: ["qualityCheck", "cancelled"],
  qualityCheck: ["packaged", "inProduction"],
  packaged: ["readyToShip"],
  readyToShip: ["shipped"],
  shipped: ["inTransit"],
  inTransit: ["outForDelivery", "delivered"],
  outForDelivery: ["delivered"],
  delivered: ["completed", "returned"],
  completed: ["returned"],
  cancelled: [],
  returned: [],
};

function requireText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > maxLength) {
    throw new HttpsError("invalid-argument", `${field} is invalid.`);
  }
  return value.trim();
}

function requireStatus(value: unknown): OrderStatus {
  if (typeof value !== "string" || !ORDER_STATUSES.includes(value as OrderStatus)) {
    throw new HttpsError("invalid-argument", "nextStatus is invalid.");
  }
  return value as OrderStatus;
}

export const appendOrderTimeline = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in is required.");

  const orderId = requireText(request.data?.orderId, "orderId", 120);
  const event = requireText(request.data?.event, "event", 500);
  const nextStatus = requireStatus(request.data?.nextStatus);
  const db = getFirestore();
  const orderReference = db.collection("orders").doc(orderId);
  const actorUid = request.auth.uid;
  const role = typeof request.auth.token.role === "string" ? request.auth.token.role : "customer";
  const claimStudioId = typeof request.auth.token.studioId === "string" ? request.auth.token.studioId : null;

  const previous = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(orderReference);
    if (!snapshot.exists) throw new HttpsError("not-found", "Order not found.");
    const order = snapshot.data() ?? {};
    const currentStatus = order.orderStatus as OrderStatus;
    const isCustomer = order.customerId === actorUid;
    const isStudioOwner = role === "seller" && claimStudioId === order.studioId;
    const isAdmin = ["support", "financeManager", "founder", "superAdmin"].includes(role);

    if (!isCustomer && !isStudioOwner && !isAdmin) {
      throw new HttpsError("permission-denied", "You cannot update this order.");
    }
    if (isCustomer && !isAdmin && !isStudioOwner && nextStatus !== "cancelled") {
      throw new HttpsError("permission-denied", "Customers may only request cancellation through this endpoint.");
    }
    if (!TRANSITIONS[currentStatus]?.includes(nextStatus)) {
      throw new HttpsError("failed-precondition", `Order cannot move from ${currentStatus} to ${nextStatus}.`);
    }

    const timeline = Array.isArray(order.timeline) ? order.timeline : [];
    transaction.update(orderReference, {
      orderStatus: nextStatus,
      timeline: [...timeline, { event, timestamp: Timestamp.now(), actor: actorUid }],
      updatedAt: Timestamp.now(),
    });
    return { currentStatus, studioId: order.studioId, customerId: order.customerId };
  });

  await writeAuditLog({
    actorUid,
    action: "order.status.transitioned",
    targetType: "order",
    targetId: orderId,
    previousValue: { orderStatus: previous.currentStatus },
    newValue: { orderStatus: nextStatus, event },
    ipAddress: request.rawRequest.ip ?? null,
    userAgent: request.rawRequest.get("user-agent") ?? null,
  });

  return { orderId, status: nextStatus };
});

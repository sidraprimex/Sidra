import crypto from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { calculateCommissionPaise, type CommissionConfig } from "./commissionEngine";
import { isLegalTransition, type ActorRole, type OrderStatus } from "./orderStateMachine";

const customerVisibleStatuses = new Set<OrderStatus>(["placed", "shipped", "inTransit", "outForDelivery", "delivered", "completed", "cancelled", "refunded"]);

export const updateOrderStatus = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required.");
  const actorId = request.auth.uid;
  const role = String(request.auth.token.role ?? "customer") as ActorRole;
  const studioId = typeof request.auth.token.studioId === "string" ? request.auth.token.studioId : null;
  const orderId = String(request.data?.orderId ?? "");
  const nextStatus = String(request.data?.nextStatus ?? "") as OrderStatus;
  const force = Boolean(request.data?.force);
  const reason = String(request.data?.reason ?? "").trim();
  const shippingPackage = request.data?.shippingPackage;
  if (!orderId || !nextStatus) throw new HttpsError("invalid-argument", "Order and status are required.");

  const db = getFirestore();
  await db.runTransaction(async (transaction) => {
    const orderRef = db.collection("orders").doc(orderId);
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists) throw new HttpsError("not-found", "Order not found.");
    const order = snapshot.data() ?? {};
    const current = String(order.orderStatus ?? "placed") as OrderStatus;

    if (role === "seller" && studioId !== order.studioId) throw new HttpsError("permission-denied", "Order does not belong to this Studio.");
    if (!isLegalTransition(current, nextStatus, role, force)) throw new HttpsError("failed-precondition", `Illegal transition ${current} -> ${nextStatus}.`);
    if ((role === "founder" || role === "superAdmin") && force && reason.length < 4) throw new HttpsError("invalid-argument", "Founder override reason is required.");

    if (nextStatus === "readyToShip") {
      const valid = shippingPackage
        && Number(shippingPackage.weightGrams) > 0
        && Number(shippingPackage.lengthCm) > 0
        && Number(shippingPackage.widthCm) > 0
        && Number(shippingPackage.heightCm) > 0
        && String(shippingPackage.courierName ?? "").trim().length > 1
        && String(shippingPackage.trackingNumber ?? "").trim().length > 2
        && String(shippingPackage.estimatedDeliveryDate ?? "").length > 0;
      if (!valid) throw new HttpsError("invalid-argument", "Complete shipping information is required.");
    }

    const timelineEntry = {
      id: crypto.randomUUID(),
      status: nextStatus,
      label: nextStatus,
      actorId,
      actorRole: role,
      reason: reason || null,
      createdAt: new Date().toISOString(),
      customerVisible: customerVisibleStatuses.has(nextStatus),
    };
    const update: Record<string, unknown> = {
      orderStatus: nextStatus,
      timeline: FieldValue.arrayUnion(timelineEntry),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (nextStatus === "readyToShip") update.shippingPackage = shippingPackage;

    if (nextStatus === "completed") {
      const settings = await transaction.get(db.collection("settings").doc("commission"));
      const config = (settings.data() ?? { mode: "percentage", percentageBasisPoints: 0 }) as CommissionConfig;
      const grossPaise = Number(order.totalPaise ?? 0);
      const commissionPaise = calculateCommissionPaise(grossPaise, config, String(order.categoryId ?? "default"), String(order.subscriptionTier ?? "starter"));
      const payoutRef = db.collection("payouts").doc();
      transaction.create(payoutRef, {
        orderId,
        studioId: order.studioId,
        grossPaise,
        commissionPaise,
        sellerAmountPaise: grossPaise - commissionPaise,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.update(orderRef, update);
    transaction.create(db.collection("auditLogs").doc(), {
      action: force ? "orderForceTransitioned" : "orderStatusUpdated",
      actorId,
      actorRole: role,
      entityType: "order",
      entityId: orderId,
      before: { orderStatus: current },
      after: { orderStatus: nextStatus },
      reason: reason || null,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return { accepted: true };
});

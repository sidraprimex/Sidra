import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import {
  requireRole,
  requireServerIdentity,
  sidraAdminDb,
} from "@/lib/server/firebaseAdmin";
import { resolveServerCheckout } from "@/lib/server/commerceCheckout";
import { handleExtendedBackendAction } from "@/lib/server/extendedBackendActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const activeStatuses = [
  "placed",
  "accepted",
  "inProduction",
  "qualityCheck",
  "packaged",
  "readyToShip",
  "shipped",
  "inTransit",
  "outForDelivery",
];
const transitions: Record<string, string[]> = {
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
};
function value(input: unknown): Record<string, unknown> {
  return (input && typeof input === "object" ? input : {}) as Record<
    string,
    unknown
  >;
}
function text(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}
function statusFor(error: unknown): number {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("AUTH")) return 401;
  if (message.includes("PERMISSION") || message.includes("ACCESS")) return 403;
  if (message.includes("MISSING") || message.includes("NOT_FOUND")) return 404;
  if (message.includes("CONFIG") || message.includes("CREDENTIAL")) return 503;
  return 400;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
): Promise<NextResponse> {
  try {
    const { action } = await context.params;
    const input = value(await request.json());
    const identity = await requireServerIdentity(request);
    const db = sidraAdminDb();
    let data: unknown;
    switch (action) {
      case "initiatePayment": {
        if (!identity.emailVerified)
          throw new Error("EMAIL_VERIFICATION_REQUIRED");
        const checkout = await resolveServerCheckout(
          identity.uid,
          input.checkout,
        );
        const key = process.env.RAZORPAY_KEY_ID ?? "";
        const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
        if (!key || !secret) throw new Error("RAZORPAY_CONFIG_MISSING");
        const checkoutReference = crypto.randomUUID();
        const response = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            amount: checkout.totalPaise,
            currency: "INR",
            receipt: checkoutReference,
          }),
        });
        if (!response.ok) throw new Error("RAZORPAY_ORDER_FAILED");
        const gateway = (await response.json()) as { id: string };
        await db
          .collection("paymentSessions")
          .doc(checkoutReference)
          .set({
            customerId: identity.uid,
            gatewayOrderId: gateway.id,
            checkout,
            status: "initiated",
            createdAt: FieldValue.serverTimestamp(),
          });
        data = {
          gatewayOrderId: gateway.id,
          publicKey: key,
          amountPaise: checkout.totalPaise,
          currency: "INR",
          checkoutReference,
        };
        break;
      }
      case "getCustomerDashboardSummary": {
        const uid = identity.uid;
        const results = await Promise.all([
          db
            .collection("orders")
            .where("customerId", "==", uid)
            .where("orderStatus", "in", activeStatuses)
            .count()
            .get(),
          db
            .collection("orders")
            .where("customerId", "==", uid)
            .where("orderStatus", "in", ["delivered", "completed"])
            .count()
            .get(),
          db
            .collection("customOrders")
            .where("customerId", "==", uid)
            .count()
            .get(),
          db.collection("wishlists").doc(uid).collection("items").count().get(),
          db
            .collection("studioFollows")
            .where("customerId", "==", uid)
            .count()
            .get(),
          db
            .collection("reviews")
            .where("customerId", "==", uid)
            .where("status", "==", "pending")
            .count()
            .get(),
          db
            .collection("notifications")
            .where("recipientUid", "==", uid)
            .where("read", "==", false)
            .count()
            .get(),
        ]);
        data = {
          activeOrderCount: results[0].data().count,
          deliveredOrderCount: results[1].data().count,
          customOrderCount: results[2].data().count,
          wishlistCount: results[3].data().count,
          followedStudioCount: results[4].data().count,
          pendingReviewCount: results[5].data().count,
          unreadNotificationCount: results[6].data().count,
        };
        break;
      }
      case "toggleStudioFollow": {
        const studioId = text(input.studioId);
        if (!studioId) throw new Error("STUDIO_MISSING");
        const ref = db
          .collection("studioFollows")
          .doc(`${identity.uid}_${studioId}`);
        if ((await ref.get()).exists) {
          await ref.delete();
          data = { active: false };
        } else {
          await ref.set({
            customerId: identity.uid,
            studioId,
            targetType: "studio",
            createdAt: FieldValue.serverTimestamp(),
          });
          data = { active: true };
        }
        break;
      }
      case "updateOrderStatus": {
        const orderId = text(input.orderId),
          next = text(input.nextStatus);
        const ref = db.collection("orders").doc(orderId);
        await db.runTransaction(async (transaction) => {
          const snap = await transaction.get(ref);
          if (!snap.exists) throw new Error("ORDER_NOT_FOUND");
          const order = snap.data() ?? {};
          const isAdmin = ["founder", "superAdmin"].includes(identity.role);
          if (
            !isAdmin &&
            (identity.role !== "seller" || identity.studioId !== order.studioId)
          )
            throw new Error("ORDER_ACCESS_DENIED");
          const current = String(order.orderStatus ?? "placed");
          if (!isAdmin && !transitions[current]?.includes(next))
            throw new Error("ILLEGAL_ORDER_TRANSITION");
          transaction.update(ref, {
            orderStatus: next,
            timeline: FieldValue.arrayUnion({
              id: crypto.randomUUID(),
              status: next,
              label: next,
              actorId: identity.uid,
              actorRole: identity.role,
              reason: text(input.reason) || null,
              createdAt: new Date().toISOString(),
              customerVisible: true,
            }),
            updatedAt: FieldValue.serverTimestamp(),
          });
          if (order.customerId)
            transaction.create(db.collection("notifications").doc(), {
              recipientUid: order.customerId,
              type: "orderStatusUpdated",
              title: `Order ${String(order.orderNumber ?? orderId)} updated`,
              body: `Your order is now ${next}.`,
              actionUrl: `/account/orders/${orderId}`,
              read: false,
              orderId,
              createdAt: FieldValue.serverTimestamp(),
            });
          if (next === "delivered") {
            const payout = db.collection("payouts").doc(`profit-${orderId}`);
            const profit = Number(order.profitPaise ?? 0);
            const commission = Number(
              order.commissionPaise ??
                Math.round(
                  (profit * Number(order.commissionRateBasisPoints ?? 1200)) /
                    10000,
                ),
            );
            transaction.set(
              payout,
              {
                payoutId: payout.id,
                orderId,
                studioId: order.studioId,
                sellerUid: order.sellerUid ?? null,
                type: "orderSettlement",
                grossPaise:
                  Number(order.subtotalPaise ?? order.totalPaise ?? 0) -
                  Number(order.discountPaise ?? 0),
                commissionPaise: Math.max(0, commission),
                sellerAmountPaise: Number(
                  order.sellerEarningPaise ??
                    Math.max(
                      0,
                      Number(order.sellerCostPaise ?? 0) + profit - commission,
                    ),
                ),
                status: "available",
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
          }
        });
        data = { accepted: true };
        break;
      }
      case "markAllNotificationsRead": {
        const snapshot = await db
          .collection("notifications")
          .where("recipientUid", "==", identity.uid)
          .where("read", "==", false)
          .limit(500)
          .get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) =>
          batch.update(doc.ref, {
            read: true,
            readAt: FieldValue.serverTimestamp(),
          }),
        );
        await batch.commit();
        data = { updated: snapshot.size };
        break;
      }
      case "getSellerAnalyticsSummary": {
        const studioId = text(input.studioId);
        if (identity.role !== "seller" || identity.studioId !== studioId)
          throw new Error("STUDIO_ACCESS_DENIED");
        const stored =
          (
            await db.collection("sellerAnalyticsSummary").doc(studioId).get()
          ).data() ?? {};
        data = {
          grossSalesPaise: Number(stored.grossSalesPaise ?? 0),
          netSalesPaise: Number(stored.netSalesPaise ?? 0),
          orderCount: Number(stored.orderCount ?? 0),
          customOrderCount: Number(stored.customOrderCount ?? 0),
          averageOrderValuePaise: Number(stored.averageOrderValuePaise ?? 0),
          conversionRate: Number(stored.conversionRate ?? 0),
          repeatCustomerRate: Number(stored.repeatCustomerRate ?? 0),
          refundRate: Number(stored.refundRate ?? 0),
          wishlistCount: Number(stored.wishlistCount ?? 0),
          followerCount: Number(stored.followerCount ?? 0),
        };
        break;
      }
      case "saveSellerCoupon":
      case "saveCustomerSegment":
      case "saveSellerCampaign": {
        const studioId = text(input.studioId);
        if (identity.role !== "seller" || identity.studioId !== studioId)
          throw new Error("STUDIO_ACCESS_DENIED");
        const collectionName =
          action === "saveSellerCoupon"
            ? "sellerCoupons"
            : action === "saveCustomerSegment"
              ? "customerSegments"
              : "sellerCampaigns";
        const ref = db.collection(collectionName).doc();
        const record = {
          ...input,
          studioId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (action === "saveSellerCoupon")
          Object.assign(record, {
            code: text(input.code)
              .toUpperCase()
              .replace(/[^A-Z0-9_-]/g, "")
              .slice(0, 24),
            discountType: "percentage",
            usedCount: 0,
          });
        if (action === "saveSellerCampaign")
          Object.assign(record, {
            status: "draft",
            sentCount: 0,
            deliveredCount: 0,
            openedCount: 0,
            clickedCount: 0,
          });
        if (action === "saveCustomerSegment")
          Object.assign(record, { customerCount: 0 });
        await ref.set(record);
        data = { couponId: ref.id, segmentId: ref.id, campaignId: ref.id };
        break;
      }
      case "getFounderControlCenterSummary": {
        requireRole(identity, ["founder", "superAdmin"]);
        const counts = await Promise.all([
          db
            .collection("sellerApplications")
            .where("status", "==", "pending")
            .count()
            .get(),
          db
            .collection("sellers")
            .where("status", "==", "active")
            .count()
            .get(),
          db
            .collection("products")
            .where("status", "==", "published")
            .count()
            .get(),
          db
            .collection("orders")
            .where("orderStatus", "in", activeStatuses)
            .count()
            .get(),
          db
            .collection("customOrders")
            .where("status", "in", [
              "submitted",
              "sellerReview",
              "quoted",
              "depositPending",
              "inProduction",
              "proofReady",
              "customerReview",
            ])
            .count()
            .get(),
          db
            .collection("reviews")
            .where("status", "==", "pending")
            .count()
            .get(),
          db
            .collection("founderAlerts")
            .where("read", "==", false)
            .count()
            .get(),
        ]);
        const finance =
          (await db.collection("financeSummary").doc("current").get()).data() ??
          {};
        data = {
          pendingSellerApplications: counts[0].data().count,
          activeSellers: counts[1].data().count,
          publishedProducts: counts[2].data().count,
          pendingOrders: counts[3].data().count,
          pendingCustomOrders: counts[4].data().count,
          pendingReviews: counts[5].data().count,
          unreadFounderAlerts: counts[6].data().count,
          finance: {
            grossRevenuePaise: Number(finance.grossRevenuePaise ?? 0),
            platformRevenuePaise: Number(finance.platformRevenuePaise ?? 0),
            sellerPayablePaise: Number(finance.sellerPayablePaise ?? 0),
            refundsPaise: Number(finance.refundsPaise ?? 0),
            pendingPayoutPaise: Number(finance.pendingPayoutPaise ?? 0),
            completedPayoutPaise: Number(finance.completedPayoutPaise ?? 0),
            orderCount: Number(finance.orderCount ?? 0),
            customOrderCount: Number(finance.customOrderCount ?? 0),
          },
        };
        break;
      }
      case "savePlatformContent": {
        requireRole(identity, ["founder", "superAdmin"]);
        const namespace = text(input.namespace).toLowerCase(),
          key = text(input.key).toLowerCase();
        if (!namespace || !key || !text(input.value))
          throw new Error("CONTENT_INVALID");
        const id = (text(input.contentId) || `${namespace}.${key}`).replace(
          /[^a-z0-9._-]/g,
          "-",
        );
        await db
          .collection("platformContent")
          .doc(id)
          .set(
            {
              ...input,
              namespace,
              key,
              updatedBy: identity.uid,
              updatedAt: FieldValue.serverTimestamp(),
              createdAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        data = { contentId: id };
        break;
      }
      case "saveCommerceSettings": {
        requireRole(identity, ["founder", "superAdmin"]);
        await db
          .collection("platformSettings")
          .doc("commerce")
          .set(
            {
              ...input,
              currency: "INR",
              updatedBy: identity.uid,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
        data = { accepted: true };
        break;
      }
      case "createSupportTicket": {
        const subject = text(input.subject),
          description = text(input.description),
          category = text(input.category);
        if (subject.length < 5 || description.length < 10)
          throw new Error("SUPPORT_DETAILS_INVALID");
        const ref = db.collection("supportTickets").doc();
        const conversationId = crypto.randomUUID();
        await ref.set({
          ticketId: ref.id,
          customerId: identity.role === "customer" ? identity.uid : null,
          studioId: identity.role === "seller" ? identity.studioId : null,
          openedByUid: identity.uid,
          assignedAdminUid: null,
          subject,
          category,
          description,
          orderId: text(input.orderId) || null,
          productId: text(input.productId) || null,
          attachmentUrls: [],
          conversationId,
          status: "open",
          priority: "normal",
          lastMessageAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          closedAt: null,
        });
        data = { ticketId: ref.id };
        break;
      }
      case "submitProductReview":
      case "createVerifiedReview": {
        const orderId = text(input.orderId),
          productId = text(input.productId);
        const order =
          (await db.collection("orders").doc(orderId).get()).data() ?? {};
        if (
          order.customerId !== identity.uid ||
          !["delivered", "completed"].includes(String(order.orderStatus))
        )
          throw new Error("REVIEW_ACCESS_DENIED");
        const items = Array.isArray(order.lineItems) ? order.lineItems : [];
        const line = items.find((item) => value(item).productId === productId);
        if (!line) throw new Error("PRODUCT_NOT_IN_ORDER");
        const ref = db
          .collection("reviews")
          .doc(`${orderId}_${productId}_${identity.uid}`);
        if ((await ref.get()).exists) throw new Error("REVIEW_EXISTS");
        await ref.set({
          reviewId: ref.id,
          customerId: identity.uid,
          studioId: order.studioId,
          productId,
          orderId,
          rating: Number(input.rating),
          title: text(input.title),
          body: text(input.body),
          imageUrls: Array.isArray(input.imageUrls)
            ? input.imageUrls.slice(0, 5)
            : [],
          verifiedPurchase: true,
          status: "pending",
          moderationStatus: "visible",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        data = { reviewId: ref.id };
        break;
      }
      case "respondToReview": {
        if (identity.role !== "seller") throw new Error("SELLER_ACCESS_DENIED");
        const ref = db.collection("reviews").doc(text(input.reviewId));
        const review = (await ref.get()).data() ?? {};
        if (review.studioId !== identity.studioId)
          throw new Error("REVIEW_ACCESS_DENIED");
        await ref.update({
          sellerResponse: text(input.response),
          sellerRespondedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        data = { accepted: true };
        break;
      }
      default: {
        const extended = await handleExtendedBackendAction(
          action,
          input,
          identity,
        );
        if (!extended.handled)
          throw new Error(`VERCEL_ACTION_NOT_IMPLEMENTED_${action}`);
        data = extended.data;
      }
    }
    return NextResponse.json({ data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "SERVER_REQUEST_FAILED";
    return NextResponse.json({ error: message }, { status: statusFor(error) });
  }
}

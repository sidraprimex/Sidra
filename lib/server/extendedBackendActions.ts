import crypto from "node:crypto";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { FieldValue } from "firebase-admin/firestore";
import { resolveServerCheckout } from "@/lib/server/commerceCheckout";
import {
  requireRole,
  sidraAdminDb,
  type SidraServerIdentity,
} from "@/lib/server/firebaseAdmin";

type Input = Record<string, unknown>;
type Result = { handled: true; data: unknown } | { handled: false };
const RELEASE_GATES = [
  "authFlows",
  "securityRules",
  "customerJourney",
  "sellerProvisioning",
  "webhookForgery",
  "performanceBudgets",
  "bugGate",
  "recentBackup",
  "rbacMatrix",
  "loadTest",
] as const;
const RELEASE_STATUSES = ["notRun", "running", "passed", "failed", "blocked"];
const SECURITY_STATUSES = ["open", "reviewing", "dismissed", "confirmed"];
const ORDER_TRANSITIONS: Record<string, readonly string[]> = {
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
const ADMIN_SNAPSHOT_COLLECTIONS = {
  users: "users",
  studios: "studios",
  products: "products",
  orders: "orders",
  customOrders: "customOrders",
  supportTickets: "supportTickets",
  sellerApplications: "sellerApplications",
  manualPaymentRequests: "manualPaymentRequests",
  sellerSubscriptionRequests: "sellerSubscriptionRequests",
  payouts: "payouts",
  sellerWithdrawals: "sellerWithdrawals",
  sellerVerifications: "sellerVerifications",
  auditLogs: "adminAuditLogs",
} as const;
const ADMIN_EDITABLE_COLLECTIONS = new Set([
  ...Object.values(ADMIN_SNAPSHOT_COLLECTIONS),
  "cms",
  "settings",
  "platformContent",
  "platformSettings",
  "messages",
  "payments",
  "categories",
  "collections",
  "notifications",
  "reviews",
]);

function text(value: unknown, max = 2_000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}
function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function renderSvg(strokes: unknown, width: unknown, height: unknown): string {
  if (!Array.isArray(strokes) || strokes.length === 0)
    throw new Error("HANDWRITING_MISSING");
  const w = Math.min(1200, Math.max(300, Number(width) || 300));
  const h = Math.min(800, Math.max(180, Number(height) || 180));
  const paths = strokes
    .filter(Array.isArray)
    .map((stroke) => {
      const points = stroke
        .map(object)
        .filter(
          (point) =>
            Number.isFinite(Number(point.x)) &&
            Number.isFinite(Number(point.y)),
        );
      if (points.length < 2) return "";
      return `<path d="M ${points.map((point, index) => `${index ? "L" : ""} ${Number(point.x).toFixed(1)} ${Number(point.y).toFixed(1)}`).join(" ")}"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="white"/><g fill="none" stroke="black" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`;
}
function normalized(value: string): string {
  return value.toLocaleLowerCase("en").replace(/[^a-z0-9]/g, "");
}
function adminCollection(value: unknown): string {
  const collectionName = text(value, 80);
  if (!ADMIN_EDITABLE_COLLECTIONS.has(collectionName)) {
    throw new Error("ADMIN_COLLECTION_DENIED");
  }
  return collectionName;
}
function adminDocumentId(value: unknown): string {
  const documentId = text(value, 180);
  if (!documentId || documentId.includes("/")) {
    throw new Error("ADMIN_DOCUMENT_INVALID");
  }
  return documentId;
}
function jsonSafe(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (value && typeof value === "object") {
    const candidate = value as { toDate?: unknown };
    if (typeof candidate.toDate === "function") {
      return (candidate.toDate as () => Date)().toISOString();
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, jsonSafe(item)]),
    );
  }
  return value;
}
function adminAuditRecord(identity: SidraServerIdentity, input: Input, entityType: string, entityId: string) {
  return {
    actorUid: identity.uid,
    actorRole: identity.role,
    action: text(input.action, 120) || "document.save",
    entityType,
    entityId,
    summary: text(input.summary, 500) || `Saved ${entityType}/${entityId}`,
    createdAt: FieldValue.serverTimestamp(),
  };
}

async function createManualOrders(
  requestId: string,
  identity: SidraServerIdentity,
): Promise<string[]> {
  requireRole(identity, ["founder", "superAdmin", "financeManager"]);
  const db = sidraAdminDb();
  const requestRef = db.collection("manualPaymentRequests").doc(requestId);
  const requestSnapshot = await requestRef.get();
  if (!requestSnapshot.exists) throw new Error("PAYMENT_REQUEST_NOT_FOUND");
  const payment = requestSnapshot.data() ?? {};
  if (payment.status !== "pendingVerification")
    throw new Error("PAYMENT_ALREADY_REVIEWED");
  const submittedItems = Array.isArray(payment.items) ? payment.items : [];
  const checkout = await resolveServerCheckout(
    String(payment.customerId ?? ""),
    {
      addressId: payment.addressId,
      items: submittedItems,
      couponId: payment.couponId,
    },
  );
  if (checkout.totalPaise !== Number(payment.totalPaise ?? -1))
    throw new Error("PAYMENT_TOTAL_CHANGED");
  const byStudio = new Map<string, typeof checkout.items>();
  checkout.items.forEach((item) =>
    byStudio.set(item.studioId, [...(byStudio.get(item.studioId) ?? []), item]),
  );
  const orderIds: string[] = [];
  await db.runTransaction(async (transaction) => {
    const fresh = await transaction.get(requestRef);
    if (fresh.data()?.status !== "pendingVerification")
      throw new Error("PAYMENT_ALREADY_REVIEWED");
    const productEntries = await Promise.all(
      checkout.items.map(async (item) => {
        const productRef = db.collection("products").doc(item.productId);
        return { item, productRef, product: await transaction.get(productRef) };
      }),
    );
    for (const { item, productRef, product } of productEntries) {
      if (!product.exists || product.data()?.status !== "published")
        throw new Error("PRODUCT_UNAVAILABLE");
      if (product.data()?.inventoryMode === "finite") {
        const inventory = Number(product.data()?.inventoryCount ?? 0);
        if (inventory < item.quantity)
          throw new Error("INSUFFICIENT_INVENTORY");
        transaction.update(productRef, {
          inventoryCount: inventory - item.quantity,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    let index = 0;
    for (const [studioId, items] of byStudio) {
      const orderRef = db.collection("orders").doc();
      const subtotalPaise = items.reduce(
        (sum, item) => sum + item.unitPricePaise * item.quantity,
        0,
      );
      const shippingPaise = checkout.shippingPaise > 0 ? 9_900 : 0;
      const discountPaise =
        checkout.couponStudioId === studioId ? checkout.discountPaise : 0;
      const sellerCostPaise = items.reduce(
        (sum, item) => sum + item.makingCostPaise * item.quantity,
        0,
      );
      const profitPaise = Math.max(
        0,
        subtotalPaise - discountPaise - sellerCostPaise,
      );
      const commissionRateBasisPoints =
        items[0]?.commissionRateBasisPoints ?? 1200;
      const commissionPaise = Math.round(
        (profitPaise * commissionRateBasisPoints) / 10_000,
      );
      const sellerEarningPaise = Math.max(
        0,
        sellerCostPaise + profitPaise - commissionPaise,
      );
      const orderNumber = `SDR-${Date.now().toString(36).toUpperCase()}-${String(index + 1).padStart(2, "0")}`;
      transaction.create(orderRef, {
        orderId: orderRef.id,
        orderNumber,
        customerId: payment.customerId,
        customerName: checkout.customer.name,
        customerEmail: checkout.customer.email,
        customerPhone: checkout.customer.phone,
        studioId,
        studioIds: [studioId],
        studioName: items[0]?.studioName ?? "Sidra Studio",
        sellerUid: items[0]?.sellerUid ?? null,
        lineItems: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.productName,
          qty: item.quantity,
          unitPrice: item.unitPricePaise,
          subtotal: item.unitPricePaise * item.quantity,
        })),
        items,
        orderStatus: "placed",
        status: "placed",
        paymentStatus: "paid",
        subtotalPaise,
        shippingPaise,
        discountPaise,
        totalPaise: subtotalPaise + shippingPaise - discountPaise,
        sellerCostPaise,
        profitPaise,
        commissionRateBasisPoints,
        commissionPaise,
        sellerEarningPaise,
        shippingAddress: checkout.shippingAddress,
        paymentGateway: "manualUpi",
        paymentReference: payment.paymentReference,
        manualPaymentRequestId: requestId,
        acceptedPolicies: payment.acceptedPolicies ?? {},
        shippingPackage: null,
        invoiceUrl: "",
        customOrderId: null,
        timeline: [
          {
            id: crypto.randomUUID(),
            status: "placed",
            label: "Payment verified and order placed",
            actorId: identity.uid,
            actorRole: identity.role,
            reason: null,
            createdAt: new Date().toISOString(),
            customerVisible: true,
          },
        ],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (items[0]?.sellerUid)
        transaction.create(db.collection("notifications").doc(), {
          recipientUid: items[0].sellerUid,
          type: "newOrder",
          title: "New paid order received",
          body: `Order ${orderNumber} is ready for acceptance.`,
          actionUrl: `/studio-admin/orders/${orderRef.id}`,
          read: false,
          studioId,
          orderId: orderRef.id,
          createdAt: FieldValue.serverTimestamp(),
        });
      orderIds.push(orderRef.id);
      index += 1;
    }
    transaction.create(db.collection("payments").doc(), {
      orderId: orderIds[0] ?? null,
      orderIds,
      customerId: payment.customerId,
      gateway: "manualUpi",
      amountPaise: checkout.totalPaise,
      currency: "INR",
      status: "captured",
      gatewayTransactionId: payment.paymentReference,
      manualPaymentRequestId: requestId,
      verifiedBy: identity.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.create(db.collection("notifications").doc(), {
      recipientUid: payment.customerId,
      type: "paymentVerified",
      title: "Payment verified · order confirmed",
      body: "Your payment was verified and the seller received your order.",
      actionUrl: orderIds[0]
        ? `/account/orders/${orderIds[0]}`
        : "/account/payments",
      read: false,
      orderId: orderIds[0] ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.update(requestRef, {
      status: "verified",
      verifiedBy: identity.uid,
      orderIds,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return orderIds;
}

export async function handleExtendedBackendAction(
  action: string,
  input: Input,
  identity: SidraServerIdentity,
): Promise<Result> {
  const db = sidraAdminDb();
  if (action === "loadAdminSnapshot") {
    requireRole(identity, ["founder", "superAdmin"]);
    const requested = Math.round(Number(input.maxResults ?? 250));
    const maxResults = Math.max(1, Math.min(250, Number.isFinite(requested) ? requested : 250));
    const entries = await Promise.all(
      Object.entries(ADMIN_SNAPSHOT_COLLECTIONS).map(async ([key, collectionName]) => {
        const snapshot = await db.collection(collectionName).limit(maxResults).get();
        return [key, snapshot.docs.map((document) => ({ id: document.id, data: jsonSafe(document.data()) }))] as const;
      }),
    );
    return { handled: true, data: Object.fromEntries(entries) };
  }
  if (action === "listAdminCollection") {
    requireRole(identity, ["founder", "superAdmin"]);
    const collectionName = adminCollection(input.collectionName);
    const requested = Math.round(Number(input.maxResults ?? 250));
    const maxResults = Math.max(1, Math.min(500, Number.isFinite(requested) ? requested : 250));
    const snapshot = await db.collection(collectionName).limit(maxResults).get();
    return {
      handled: true,
      data: snapshot.docs.map((document) => ({ id: document.id, data: jsonSafe(document.data()) })),
    };
  }
  if (action === "getAdminDocument") {
    requireRole(identity, ["founder", "superAdmin"]);
    const collectionName = adminCollection(input.collectionName);
    const documentId = adminDocumentId(input.documentId);
    const snapshot = await db.collection(collectionName).doc(documentId).get();
    return {
      handled: true,
      data: snapshot.exists ? { id: snapshot.id, data: jsonSafe(snapshot.data() ?? {}) } : null,
    };
  }
  if (action === "updateAdminDocument" || action === "setAdminDocument") {
    requireRole(identity, ["founder", "superAdmin"]);
    const collectionName = adminCollection(input.collectionName);
    const documentId = adminDocumentId(input.documentId);
    const supplied = object(action === "updateAdminDocument" ? input.patch : input.value);
    const clean = Object.fromEntries(
      Object.entries(supplied).filter(([key]) => !["createdAt", "updatedAt", "updatedBy"].includes(key)),
    );
    if (Object.keys(clean).length === 0) throw new Error("ADMIN_DOCUMENT_EMPTY");
    const documentRef = db.collection(collectionName).doc(documentId);
    const auditRef = db.collection("adminAuditLogs").doc();
    const batch = db.batch();
    if (action === "updateAdminDocument") {
      batch.update(documentRef, { ...clean, updatedAt: FieldValue.serverTimestamp(), updatedBy: identity.uid });
    } else {
      batch.set(documentRef, { ...clean, updatedAt: FieldValue.serverTimestamp(), updatedBy: identity.uid }, { merge: input.merge !== false });
    }
    batch.create(auditRef, adminAuditRecord(identity, input, collectionName, documentId));
    await batch.commit();
    return { handled: true, data: { accepted: true } };
  }
  if (action === "deleteAdminDocument") {
    requireRole(identity, ["founder", "superAdmin"]);
    const collectionName = adminCollection(input.collectionName);
    const documentId = adminDocumentId(input.documentId);
    const documentRef = db.collection(collectionName).doc(documentId);
    const auditRef = db.collection("adminAuditLogs").doc();
    const batch = db.batch();
    batch.delete(documentRef);
    batch.create(auditRef, adminAuditRecord(identity, input, collectionName, documentId));
    await batch.commit();
    return { handled: true, data: { accepted: true } };
  }
  if (action === "markOrderDeliveredAndSettle") {
    requireRole(identity, ["founder", "superAdmin"]);
    const orderId = adminDocumentId(input.orderId);
    const orderRef = db.collection("orders").doc(orderId);
    await db.runTransaction(async (transaction) => {
      const [orderSnapshot, ledgerSnapshot, settingsSnapshot] = await Promise.all([
        transaction.get(orderRef),
        transaction.get(db.collection("shippingLedgers").doc(orderId)),
        transaction.get(db.collection("settings").doc("sellerCommerce")),
      ]);
      if (!orderSnapshot.exists) throw new Error("ORDER_NOT_FOUND");
      const order = orderSnapshot.data() ?? {};
      const ledger = ledgerSnapshot.data() ?? {};
      const actualShippingPaise = Math.max(0, Number(ledger.actualChargePaise ?? order.shippingPaise ?? 0));
      const profitPaise = Math.max(0,
        Number(order.subtotalPaise ?? 0) - Number(order.discountPaise ?? 0)
        - Number(order.sellerMakingCostPaise ?? order.sellerCostPaise ?? 0) - actualShippingPaise,
      );
      const commissionBasisPoints = Math.max(0, Math.min(10_000, Number(order.commissionRateBasisPoints ?? 1200)));
      const commissionPaise = Math.round(profitPaise * commissionBasisPoints / 10_000);
      const disputeWindowDays = Math.max(0, Number(order.disputeWindowDays ?? settingsSnapshot.data()?.disputeWindowDays ?? 3));
      const availableAfter = new Date(Date.now() + disputeWindowDays * 86_400_000).toISOString();
      transaction.update(orderRef, {
        orderStatus: "delivered",
        status: "delivered",
        profitPaise,
        actualShippingPaise,
        timeline: FieldValue.arrayUnion({
          id: crypto.randomUUID(), status: "delivered", label: "Delivery verified by Sidra admin",
          actorId: identity.uid, actorRole: identity.role, reason: null,
          createdAt: new Date().toISOString(), customerVisible: true,
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.collection("payouts").doc(`profit-${orderId}`), {
        payoutId: `profit-${orderId}`, orderId, studioId: order.studioId,
        sellerUid: order.sellerUid ?? null, type: "profitSettlement", grossPaise: profitPaise,
        commissionPaise, sellerAmountPaise: Math.max(0, profitPaise - commissionPaise),
        commissionBasisPoints, subscriptionPlan: order.subscriptionPlan ?? "free",
        actualShippingPaise, status: disputeWindowDays > 0 ? "pending" : "available",
        availableAfter, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.create(db.collection("adminAuditLogs").doc(),
        adminAuditRecord(identity, { action: "order.delivery.settle", summary: "Verified delivery and created post-dispute profit settlement" }, "orders", orderId),
      );
    });
    return { handled: true, data: { accepted: true } };
  }
  if (action === "createManualPaymentRequest") {
    if (!identity.emailVerified) throw new Error("EMAIL_VERIFICATION_REQUIRED");
    const checkout = await resolveServerCheckout(identity.uid, input.checkout);
    const paymentReference = text(input.paymentReference, 180);
    if (paymentReference.length < 4)
      throw new Error("PAYMENT_REFERENCE_INVALID");
    const policies = object(input.acceptedPolicies);
    const requiredPolicies = ["terms", "shipping", "cancellation", "damageClaims"];
    if (requiredPolicies.some((key) => text(policies[key], 40).length < 4)) {
      throw new Error("POLICY_ACCEPTANCE_REQUIRED");
    }
    const ref = db.collection("manualPaymentRequests").doc();
    await ref.set({
      customerId: identity.uid,
      addressId: checkout.addressId,
      items: checkout.items,
      subtotalPaise: checkout.subtotalPaise,
      shippingPaise: checkout.shippingPaise,
      discountPaise: checkout.discountPaise,
      couponId: checkout.couponId,
      couponCode: checkout.couponCode,
      couponStudioId: checkout.couponStudioId,
      totalPaise: checkout.totalPaise,
      paymentReference,
      acceptedPolicies: Object.fromEntries(requiredPolicies.map((key) => [key, text(policies[key], 40)])),
      status: "pendingVerification",
      adminNote: null,
      verifiedBy: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { handled: true, data: { requestId: ref.id } };
  }
  if (action === "toggleWishlistProduct") {
    const productId = text(input.productId, 180);
    if (!productId) throw new Error("PRODUCT_MISSING");
    const productSnapshot = await db
      .collection("products")
      .doc(productId)
      .get();
    const product = productSnapshot.data() ?? {};
    if (!productSnapshot.exists || product.status !== "published")
      throw new Error("PRODUCT_UNAVAILABLE");
    const ref = db
      .collection("wishlists")
      .doc(identity.uid)
      .collection("items")
      .doc(productId);
    if ((await ref.get()).exists) {
      await ref.delete();
      return { handled: true, data: { active: false } };
    }
    const studioId = text(product.studioId);
    const studio =
      (await db.collection("studios").doc(studioId).get()).data() ?? {};
    await ref.set({
      customerId: identity.uid,
      productId,
      productSlug: text(product.slug),
      productName: text(product.name) || "Sidra product",
      imageUrl: text(product.heroImageUrl) || null,
      studioId,
      studioName: text(studio.name) || "Sidra Studio",
      pricePaise: Number(product.salePricePaise ?? product.pricePaise ?? 0),
      createdAt: FieldValue.serverTimestamp(),
    });
    return { handled: true, data: { active: true } };
  }
  if (action === "verifyManualMarketplacePayment") {
    return {
      handled: true,
      data: {
        orderIds: await createManualOrders(
          text(input.requestId, 120),
          identity,
        ),
      },
    };
  }
  if (action === "rejectManualMarketplacePayment") {
    requireRole(identity, ["founder", "superAdmin", "financeManager"]);
    const ref = db
      .collection("manualPaymentRequests")
      .doc(text(input.requestId, 120));
    const snapshot = await ref.get();
    if (!snapshot.exists || snapshot.data()?.status !== "pendingVerification")
      throw new Error("PAYMENT_ALREADY_REVIEWED");
    const batch = db.batch();
    batch.update(ref, {
      status: "rejected",
      verifiedBy: identity.uid,
      adminNote: text(input.reason, 500) || null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.create(db.collection("notifications").doc(), {
      recipientUid: snapshot.data()?.customerId,
      type: "paymentRejected",
      title: "Payment verification needs attention",
      body: "Your UTR could not be verified. Contact Sidra support or submit the correct reference.",
      actionUrl: "/account/payments",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return { handled: true, data: { accepted: true } };
  }
  if (action === "submitCustomOrderProof") {
    requireRole(identity, ["seller"]);
    const customOrderId = text(input.customOrderId, 120);
    const imageUrls = Array.isArray(input.imageUrls)
      ? input.imageUrls
          .filter((item): item is string => typeof item === "string")
          .slice(0, 10)
      : [];
    const note = text(input.note, 2_000);
    if (!customOrderId || !imageUrls.length || note.length < 10)
      throw new Error("PROOF_DETAILS_INVALID");
    const ref = db.collection("customOrders").doc(customOrderId);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const order = snapshot.data() ?? {};
      if (!snapshot.exists) throw new Error("CUSTOM_ORDER_NOT_FOUND");
      if (order.studioId !== identity.studioId)
        throw new Error("CUSTOM_ORDER_ACCESS_DENIED");
      if (!["inProduction", "revisionRequested"].includes(String(order.status)))
        throw new Error("PROOF_STATE_INVALID");
      transaction.update(ref, {
        status: "proofReady",
        proofs: FieldValue.arrayUnion({
          proofId: crypto.randomUUID(),
          imageUrls,
          note,
          revisionNumber: Array.isArray(order.proofs)
            ? order.proofs.length + 1
            : 1,
          status: "pendingApproval",
          createdAt: new Date().toISOString(),
          reviewedAt: null,
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    return { handled: true, data: { accepted: true } };
  }
  if (action === "reviewCustomOrderProof") {
    const customOrderId = text(input.customOrderId, 120);
    const proofId = text(input.proofId, 120);
    const decision = text(input.decision, 32);
    const reason = text(input.reason, 1_000);
    if (
      !customOrderId ||
      !proofId ||
      !["approve", "requestRevision"].includes(decision) ||
      (decision === "requestRevision" && reason.length < 8)
    )
      throw new Error("PROOF_DECISION_INVALID");
    const ref = db.collection("customOrders").doc(customOrderId);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const order = snapshot.data() ?? {};
      if (!snapshot.exists) throw new Error("CUSTOM_ORDER_NOT_FOUND");
      if (order.customerId !== identity.uid || order.status !== "proofReady")
        throw new Error("PROOF_ACCESS_DENIED");
      const proofs = Array.isArray(order.proofs)
        ? ([...order.proofs] as Input[])
        : [];
      const index = proofs.findIndex((proof) => proof.proofId === proofId);
      if (index < 0) throw new Error("PROOF_NOT_FOUND");
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
    return { handled: true, data: { accepted: true } };
  }
  if (action === "recognizeSellerHandwriting") {
    const svg = renderSvg(input.strokes, input.width, input.height);
    const [result] = await new ImageAnnotatorClient().documentTextDetection({
      image: { content: Buffer.from(svg).toString("base64") },
    });
    const recognizedText = (result.fullTextAnnotation?.text ?? "")
      .trim()
      .replace(/\s+/g, " ");
    if (!recognizedText)
      return {
        handled: true,
        data: { recognizedText: "", matchedStudio: null },
      };
    const studios = await db
      .collection("studios")
      .where("active", "==", true)
      .where("approved", "==", true)
      .limit(100)
      .get();
    const target = normalized(recognizedText);
    const match = studios.docs.find((document) =>
      [document.data().name, document.data().slug].some(
        (candidate) =>
          typeof candidate === "string" && normalized(candidate) === target,
      ),
    );
    const studio = match?.data();
    return {
      handled: true,
      data: {
        recognizedText,
        matchedStudio: match
          ? {
              id: match.id,
              slug: String(studio?.slug ?? ""),
              name: String(studio?.name ?? ""),
              heroImageUrl:
                typeof studio?.bannerUrl === "string" ? studio.bannerUrl : null,
              storyFragment:
                typeof studio?.storyFragment === "string"
                  ? studio.storyFragment
                  : null,
            }
          : null,
      },
    };
  }
  if (action === "requestOrderRefund") {
    const orderId = text(input.orderId, 120);
    const amountPaise = Number(input.amountPaise);
    const reason = text(input.reason, 1_000);
    if (
      !orderId ||
      !Number.isInteger(amountPaise) ||
      amountPaise <= 0 ||
      reason.length < 4
    )
      throw new Error("REFUND_DETAILS_INVALID");
    const orderRef = db.collection("orders").doc(orderId);
    const snapshot = await orderRef.get();
    const order = snapshot.data() ?? {};
    if (!snapshot.exists) throw new Error("ORDER_NOT_FOUND");
    const founder = ["founder", "superAdmin"].includes(identity.role);
    if (order.customerId !== identity.uid && !founder)
      throw new Error("REFUND_ACCESS_DENIED");
    if (amountPaise > Number(order.totalPaise ?? 0))
      throw new Error("REFUND_AMOUNT_INVALID");
    const postProduction = [
      "inProduction",
      "qualityCheck",
      "packaged",
      "readyToShip",
      "shipped",
      "inTransit",
      "outForDelivery",
      "delivered",
      "completed",
    ].includes(String(order.orderStatus));
    if (postProduction && !founder) {
      await db
        .collection("refundRequests")
        .add({
          orderId,
          customerId: identity.uid,
          amountPaise,
          reason,
          evidenceUrls: Array.isArray(input.evidenceUrls)
            ? input.evidenceUrls.slice(0, 8)
            : [],
          status: "founderReview",
          createdAt: FieldValue.serverTimestamp(),
        });
      await orderRef.update({
        orderStatus: "refundRequested",
        paymentStatus: "refundPending",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { handled: true, data: { accepted: true } };
    }
    const direct = await db
      .collection("payments")
      .where("orderId", "==", orderId)
      .limit(1)
      .get();
    const paymentDocument =
      direct.docs[0] ??
      (
        await db
          .collection("payments")
          .where("orderIds", "array-contains", orderId)
          .limit(1)
          .get()
      ).docs[0];
    if (!paymentDocument) throw new Error("CAPTURED_PAYMENT_NOT_FOUND");
    const gatewayPaymentId = text(paymentDocument.data().gatewayPaymentId);
    if (!gatewayPaymentId) throw new Error("AUTOMATIC_REFUND_UNAVAILABLE");
    const key = process.env.RAZORPAY_KEY_ID ?? "";
    const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${gatewayPaymentId}/refund`,
      {
        method: "POST",
        headers: {
          authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          amount: amountPaise,
          notes: { orderId, reason },
        }),
      },
    );
    if (!response.ok) throw new Error("GATEWAY_REFUND_FAILED");
    const refund = (await response.json()) as { id: string };
    const batch = db.batch();
    batch.update(orderRef, {
      orderStatus: "refunded",
      paymentStatus:
        amountPaise === Number(order.totalPaise)
          ? "refunded"
          : "partiallyRefunded",
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.update(paymentDocument.ref, {
      refundId: refund.id,
      refundAmountPaise: amountPaise,
      status: "refunded",
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return { handled: true, data: { accepted: true } };
  }
  if (action === "appendOrderTimeline") {
    const orderId = text(input.orderId, 120);
    const nextStatus = text(input.nextStatus, 40);
    const event = text(input.event, 500);
    const ref = db.collection("orders").doc(orderId);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const order = snapshot.data() ?? {};
      if (!snapshot.exists) throw new Error("ORDER_NOT_FOUND");
      const customer = order.customerId === identity.uid;
      const studioOwner =
        identity.role === "seller" && order.studioId === identity.studioId;
      const admin = [
        "support",
        "financeManager",
        "founder",
        "superAdmin",
      ].includes(identity.role);
      const permitted = customer || studioOwner || admin;
      if (!permitted) throw new Error("ORDER_ACCESS_DENIED");
      if (customer && !studioOwner && !admin && nextStatus !== "cancelled")
        throw new Error("ORDER_TRANSITION_DENIED");
      if (
        !ORDER_TRANSITIONS[String(order.orderStatus ?? "placed")]?.includes(
          nextStatus,
        )
      )
        throw new Error("ORDER_TRANSITION_INVALID");
      transaction.update(ref, {
        orderStatus: nextStatus,
        timeline: FieldValue.arrayUnion({
          id: crypto.randomUUID(),
          status: nextStatus,
          label: event,
          actorId: identity.uid,
          actorRole: identity.role,
          createdAt: new Date().toISOString(),
          customerVisible: true,
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    return { handled: true, data: { orderId, status: nextStatus } };
  }
  if (action === "reviewSecuritySignal") {
    requireRole(identity, ["founder", "superAdmin"]);
    const signalId = text(input.signalId, 128);
    const status = text(input.status, 32);
    if (!signalId || !SECURITY_STATUSES.includes(status))
      throw new Error("SECURITY_REVIEW_INVALID");
    await db
      .collection("securitySignals")
      .doc(signalId)
      .update({
        status,
        reviewedByUid: identity.uid,
        reviewedAt: FieldValue.serverTimestamp(),
        autoActionTaken: false,
      });
    return { handled: true, data: { updated: true } };
  }
  if (action === "saveReleaseEvidence") {
    requireRole(identity, ["founder", "superAdmin"]);
    const evidenceId = text(input.evidenceId, 64);
    const status = text(input.status, 32);
    if (
      !RELEASE_GATES.includes(evidenceId as (typeof RELEASE_GATES)[number]) ||
      !RELEASE_STATUSES.includes(status)
    )
      throw new Error("RELEASE_EVIDENCE_INVALID");
    await db
      .collection("releaseEvidence")
      .doc(evidenceId)
      .set(
        {
          evidenceId,
          status,
          summary: text(input.summary, 500),
          method: text(input.method, 300),
          artifactUrl: text(input.artifactUrl, 1_000) || null,
          measuredValue: number(input.measuredValue),
          targetValue: number(input.targetValue),
          unit: text(input.unit, 32) || null,
          notes: text(input.notes, 2_000) || null,
          executedAt: FieldValue.serverTimestamp(),
          executedByUid: identity.uid,
        },
        { merge: true },
      );
    return { handled: true, data: { updated: true } };
  }
  if (action === "getLaunchReadinessSummary") {
    requireRole(identity, ["founder", "superAdmin"]);
    const [evidenceSnapshot, signalSnapshot, bugSnapshot] = await Promise.all([
      db.collection("releaseEvidence").get(),
      db
        .collection("securitySignals")
        .where("status", "in", ["open", "reviewing"])
        .get(),
      db
        .collection("releaseBugs")
        .where("severity", "in", ["critical", "high"])
        .get(),
    ]);
    const byId = new Map(
      evidenceSnapshot.docs.map((document) => [document.id, document.data()]),
    );
    const evidence = RELEASE_GATES.map((evidenceId) => ({
      evidenceId,
      status: byId.get(evidenceId)?.status ?? "notRun",
      summary: byId.get(evidenceId)?.summary ?? "",
      method: byId.get(evidenceId)?.method ?? "",
      artifactUrl: byId.get(evidenceId)?.artifactUrl ?? null,
      measuredValue: byId.get(evidenceId)?.measuredValue ?? null,
      targetValue: byId.get(evidenceId)?.targetValue ?? null,
      unit: byId.get(evidenceId)?.unit ?? null,
      executedAt: byId.get(evidenceId)?.executedAt ?? null,
      executedByUid: byId.get(evidenceId)?.executedByUid ?? null,
      notes: byId.get(evidenceId)?.notes ?? null,
    }));
    const unresolvedCriticalBugs = bugSnapshot.docs.filter(
      (document) => document.data().status !== "closed",
    ).length;
    const passedGates = evidence.filter(
      (item) => item.status === "passed",
    ).length;
    return {
      handled: true,
      data: {
        openSignals: signalSnapshot.size,
        unresolvedCriticalBugs,
        latestBackupStatus: String(
          byId.get("recentBackup")?.status ?? "notRun",
        ),
        passedGates,
        totalGates: RELEASE_GATES.length,
        readyForProduction:
          passedGates === RELEASE_GATES.length &&
          signalSnapshot.empty &&
          unresolvedCriticalBugs === 0,
        evidence,
      },
    };
  }
  return { handled: false };
}

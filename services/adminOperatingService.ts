import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type {
  AdminRecord,
  AdminSnapshot,
  SidraIntegrationSettings,
  SidraPaymentSettings,
  SidraThemeSettings,
} from "@/types/admin-os";

const SNAPSHOT_COLLECTIONS = {
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

function normalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    if ("toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalize(item)]),
    );
  }
  return value;
}

export function toEditableRecord(value: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return normalize(value) as Record<string, unknown>;
}

export async function listAdminCollection(
  collectionName: string,
  maxResults = 250,
): Promise<readonly AdminRecord[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(collection(db, collectionName), limit(maxResults)));
  return snapshot.docs.map((item) => ({ id: item.id, data: item.data() }));
}

export async function loadAdminSnapshot(maxResults = 250): Promise<AdminSnapshot> {
  const entries = await Promise.all(
    Object.entries(SNAPSHOT_COLLECTIONS).map(async ([key, collectionName]) => [
      key,
      await listAdminCollection(collectionName, maxResults),
    ] as const),
  );
  return Object.fromEntries(entries) as unknown as AdminSnapshot;
}

async function writeAudit(input: {
  actorUid: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
}): Promise<void> {
  const { db } = requireFirebaseServices();
  await addDoc(collection(db, "adminAuditLogs"), {
    ...input,
    actorRole: "admin",
    createdAt: serverTimestamp(),
  });
}

export async function updateAdminDocument(input: {
  collectionName: string;
  documentId: string;
  patch: Readonly<Record<string, unknown>>;
  actorUid: string;
  action: string;
  summary: string;
}): Promise<void> {
  const { db } = requireFirebaseServices();
  await updateDoc(doc(db, input.collectionName, input.documentId), {
    ...input.patch,
    updatedAt: serverTimestamp(),
  });
  await writeAudit({
    actorUid: input.actorUid,
    action: input.action,
    entityType: input.collectionName,
    entityId: input.documentId,
    summary: input.summary,
  });
}

export async function setAdminDocument(input: {
  collectionName: string;
  documentId: string;
  value: Readonly<Record<string, unknown>>;
  actorUid: string;
  action?: string;
  summary?: string;
  merge?: boolean;
}): Promise<void> {
  const { db } = requireFirebaseServices();
  await setDoc(
    doc(db, input.collectionName, input.documentId),
    {
      ...input.value,
      updatedAt: serverTimestamp(),
      updatedBy: input.actorUid,
    },
    { merge: input.merge ?? true },
  );
  await writeAudit({
    actorUid: input.actorUid,
    action: input.action ?? "document.save",
    entityType: input.collectionName,
    entityId: input.documentId,
    summary: input.summary ?? `Saved ${input.collectionName}/${input.documentId}`,
  });
}

export async function deleteAdminDocument(input: {
  collectionName: string;
  documentId: string;
  actorUid: string;
}): Promise<void> {
  const { db } = requireFirebaseServices();
  await deleteDoc(doc(db, input.collectionName, input.documentId));
  await writeAudit({
    actorUid: input.actorUid,
    action: "document.delete",
    entityType: input.collectionName,
    entityId: input.documentId,
    summary: `Deleted ${input.collectionName}/${input.documentId}`,
  });
}

export async function getAdminDocument(
  collectionName: string,
  documentId: string,
): Promise<AdminRecord | null> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, collectionName, documentId));
  return snapshot.exists() ? { id: snapshot.id, data: snapshot.data() } : null;
}

export function saveThemeSettings(
  value: Omit<SidraThemeSettings, "updatedAt">,
): Promise<void> {
  return setAdminDocument({
    collectionName: "settings",
    documentId: "theme",
    value,
    actorUid: value.updatedBy,
    action: "theme.publish",
    summary: "Published Sidra global theme",
  });
}

export function savePaymentSettings(
  value: Omit<SidraPaymentSettings, "updatedAt">,
): Promise<void> {
  return setAdminDocument({
    collectionName: "settings",
    documentId: "payments",
    value,
    actorUid: value.updatedBy,
    action: "payments.configure",
    summary: `Changed payment mode to ${value.mode}`,
  });
}

export function saveIntegrationSettings(
  value: Omit<SidraIntegrationSettings, "updatedAt">,
): Promise<void> {
  return setAdminDocument({
    collectionName: "settings",
    documentId: "integrations",
    value,
    actorUid: value.updatedBy,
    action: "integrations.configure",
    summary: "Updated public integration status and provider settings",
  });
}

export async function markOrderDeliveredAndSettle(input: {
  orderId: string;
  actorUid: string;
}): Promise<void> {
  const { db } = requireFirebaseServices();
  await runTransaction(db, async (transaction) => {
    const orderRef = doc(db, "orders", input.orderId);
    const ledgerRef = doc(db, "shippingLedgers", input.orderId);
    const [orderSnapshot, ledgerSnapshot, settingsSnapshot] = await Promise.all([
      transaction.get(orderRef),
      transaction.get(ledgerRef),
      transaction.get(doc(db, "settings", "sellerCommerce")),
    ]);
    if (!orderSnapshot.exists()) throw new Error("Order not found.");
    const order = orderSnapshot.data();
    const ledger = ledgerSnapshot.data() ?? {};
    const actualShippingPaise = Math.max(0, Number(ledger.actualChargePaise ?? order.shippingPaise ?? 0));
    const profitPaise = Math.max(0,
      Number(order.subtotalPaise ?? 0)
      - Number(order.discountPaise ?? 0)
      - Number(order.sellerMakingCostPaise ?? order.sellerCostPaise ?? 0)
      - actualShippingPaise,
    );
    const commissionBasisPoints = Math.max(0, Math.min(10_000, Number(order.commissionRateBasisPoints ?? 1200)));
    const commissionPaise = Math.round(profitPaise * commissionBasisPoints / 10_000);
    const disputeWindowDays = Math.max(0, Number(order.disputeWindowDays ?? settingsSnapshot.data()?.disputeWindowDays ?? 3));
    const availableAfter = new Date(Date.now() + disputeWindowDays * 86_400_000).toISOString();
    transaction.update(orderRef, {
      orderStatus: "delivered",
      profitPaise,
      actualShippingPaise,
      timeline: [
        ...(Array.isArray(order.timeline) ? order.timeline : []),
        {
          id: crypto.randomUUID(),
          status: "delivered",
          label: "Delivery verified by Sidra admin",
          actorId: input.actorUid,
          actorRole: "admin",
          reason: null,
          createdAt: new Date().toISOString(),
          customerVisible: true,
        },
      ],
      updatedAt: serverTimestamp(),
    });
    const payoutRef = doc(db, "payouts", `profit-${input.orderId}`);
    transaction.set(payoutRef, {
      payoutId: payoutRef.id,
      orderId: input.orderId,
      studioId: order.studioId,
      sellerUid: order.sellerUid ?? null,
      type: "profitSettlement",
      grossPaise: profitPaise,
      commissionPaise,
      sellerAmountPaise: Math.max(0, profitPaise - commissionPaise),
      commissionBasisPoints,
      subscriptionPlan: order.subscriptionPlan ?? "free",
      actualShippingPaise,
      status: disputeWindowDays > 0 ? "pending" : "available",
      availableAfter,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  await writeAudit({
    actorUid: input.actorUid,
    action: "order.delivery.settle",
    entityType: "orders",
    entityId: input.orderId,
    summary: "Verified delivery and created post-dispute profit settlement",
  });
}

import { arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type {
  FulfilmentOrder,
  OrderStatusUpdateInput,
  RefundRequestInput,
  SellerPayout,
} from "@/types/phase7-orders";

function mapOrder(id: string, data: Record<string, unknown>): FulfilmentOrder {
  return { orderId: id, ...data } as FulfilmentOrder;
}

export async function listCustomerOrders(customerId: string): Promise<readonly FulfilmentOrder[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(collection(db, "orders"), where("customerId", "==", customerId), orderBy("createdAt", "desc")));
  return snapshot.docs.map((item) => mapOrder(item.id, item.data()));
}

export async function listStudioOrders(studioId: string): Promise<readonly FulfilmentOrder[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(collection(db, "orders"), where("studioId", "==", studioId), orderBy("createdAt", "desc")));
  return snapshot.docs.map((item) => mapOrder(item.id, item.data()));
}

export function subscribeOrder(orderId: string, listener: (order: FulfilmentOrder | null) => void): () => void {
  const { db } = requireFirebaseServices();
  return onSnapshot(collection(db, "orders"), (snapshot) => {
    const order = snapshot.docs.find((item) => item.id === orderId);
    listener(order ? mapOrder(order.id, order.data()) : null);
  });
}

export async function updateOrderStatus(input: OrderStatusUpdateInput): Promise<void> {
  const { db, auth } = requireFirebaseServices();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in again to update this order.");
  const orderRef = doc(db, "orders", input.orderId);
  const snapshot = await getDoc(orderRef);
  if (!snapshot.exists()) throw new Error("Order not found.");
  const order = snapshot.data();
  const batch = writeBatch(db);
  batch.update(orderRef, {
    orderStatus: input.nextStatus,
    timeline: arrayUnion({
      id: crypto.randomUUID(),
      status: input.nextStatus,
      label: input.nextStatus,
      actorId: user.uid,
      actorRole: "seller",
      reason: input.reason?.trim() || null,
      createdAt: new Date().toISOString(),
      customerVisible: false,
    }),
    updatedAt: serverTimestamp(),
  });
  const makingAdvancePaise = Math.max(0, Number(order.makingAdvancePaise ?? 0));
  if (input.nextStatus === "qualityCheck" && makingAdvancePaise > 0) {
    const payoutRef = doc(db, "payouts", `making-${input.orderId}`);
    batch.set(payoutRef, {
      payoutId: payoutRef.id,
      orderId: input.orderId,
      studioId: order.studioId,
      sellerUid: order.sellerUid ?? user.uid,
      type: "makingAdvance",
      grossPaise: makingAdvancePaise,
      commissionPaise: 0,
      sellerAmountPaise: makingAdvancePaise,
      status: "available",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function requestRefund(input: RefundRequestInput): Promise<void> {
  const callable = httpsCallable<RefundRequestInput, { accepted: true }>(
    requireFirebaseServices().functions,
    "requestOrderRefund",
  );
  await callable(input);
}

export async function listStudioPayouts(studioId: string): Promise<readonly SellerPayout[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(collection(db, "payouts"), where("studioId", "==", studioId), orderBy("createdAt", "desc")));
  return snapshot.docs.map((item) => ({ payoutId: item.id, ...item.data() } as SellerPayout));
}

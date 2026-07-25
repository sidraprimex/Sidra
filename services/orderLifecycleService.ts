import { collection, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
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
  const callable = httpsCallable<OrderStatusUpdateInput, { accepted: true }>(
    requireFirebaseServices().functions,
    "updateOrderStatus",
  );
  await callable(input);
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

import { arrayUnion, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type {
  FulfilmentOrder,
  OrderStatusUpdateInput,
  RefundRequestInput,
  SellerPayout,
} from "@/types/phase7-orders";

function dateValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value && typeof (value as {toDate?:unknown}).toDate === "function") return (value as {toDate:()=>Date}).toDate().toISOString();
  return "";
}

function mapOrder(id: string, data: Record<string, unknown>, studioId?: string): FulfilmentOrder {
  const rawItems = Array.isArray(data.lineItems) ? data.lineItems : Array.isArray(data.items) ? data.items : [];
  const visibleItems = studioId ? rawItems.filter((item) => !item || typeof item !== "object" || !("studioId" in item) || String((item as {studioId?:unknown}).studioId) === studioId) : rawItems;
  const lineItems = visibleItems.map((item) => {
    const value = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const qty = Math.max(1, Number(value.qty ?? value.quantity ?? 1));
    const unitPrice = Number(value.unitPrice ?? value.unitPricePaise ?? 0);
    return { productId:String(value.productId ?? ""), variantId:value.variantId ? String(value.variantId) : null, name:String(value.name ?? value.productName ?? "Product"), qty, unitPrice, subtotal:Number(value.subtotal ?? unitPrice * qty) };
  });
  const customer = (data.customer && typeof data.customer === "object" ? data.customer : {}) as Record<string, unknown>;
  const address = (data.shippingAddress && typeof data.shippingAddress === "object" ? data.shippingAddress : data.address && typeof data.address === "object" ? data.address : {}) as Record<string, string>;
  const status = String(data.orderStatus ?? data.status ?? "placed");
  const normalizedStatus = status === "confirmed" ? "placed" : status;
  const totalPaise = studioId ? lineItems.reduce((sum,item)=>sum+item.subtotal,0) : Number(data.totalPaise ?? 0);
  return {
    orderId:id, orderNumber:String(data.orderNumber ?? id), customerId:String(data.customerId ?? ""),
    customerName:String(data.customerName ?? customer.name ?? address.name ?? "Sidra customer"),
    customerEmail:String(data.customerEmail ?? customer.email ?? ""), customerPhone:String(data.customerPhone ?? customer.phone ?? address.phone ?? ""),
    studioId:studioId ?? String(data.studioId ?? ""), studioName:String(data.studioName ?? "Sidra Studio"), lineItems,
    orderStatus:normalizedStatus as FulfilmentOrder["orderStatus"], paymentStatus:(data.paymentStatus ?? "paid") as FulfilmentOrder["paymentStatus"],
    totalPaise, invoiceUrl:String(data.invoiceUrl ?? ""), customOrderId:data.customOrderId ? String(data.customOrderId) : null,
    shippingAddress:address, shippingPackage:(data.shippingPackage ?? null) as FulfilmentOrder["shippingPackage"],
    timeline:Array.isArray(data.timeline) ? data.timeline as FulfilmentOrder["timeline"] : [], createdAt:dateValue(data.createdAt), updatedAt:dateValue(data.updatedAt),
  };
}

export async function listCustomerOrders(customerId: string): Promise<readonly FulfilmentOrder[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(collection(db, "orders"), where("customerId", "==", customerId)));
  return snapshot.docs.map((item) => mapOrder(item.id, item.data())).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}

export async function listStudioOrders(studioId: string): Promise<readonly FulfilmentOrder[]> {
  const { db } = requireFirebaseServices();
  const [direct, grouped] = await Promise.all([
    getDocs(query(collection(db, "orders"), where("studioId", "==", studioId))),
    getDocs(query(collection(db, "orders"), where("studioIds", "array-contains", studioId))),
  ]);
  const merged = new Map<string, FulfilmentOrder>();
  direct.docs.forEach((item)=>merged.set(item.id,mapOrder(item.id,item.data(),studioId)));
  grouped.docs.forEach((item)=>merged.set(item.id,mapOrder(item.id,item.data(),studioId)));
  return [...merged.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
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

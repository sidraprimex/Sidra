import { collection, doc, getDocs, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { callVercelBackend } from "@/services/vercelBackendService";
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
    totalPaise, subtotalPaise:Number(data.subtotalPaise ?? totalPaise), discountPaise:Number(data.discountPaise ?? 0),
    sellerCostPaise:Number(data.sellerCostPaise ?? 0), profitPaise:Number(data.profitPaise ?? 0),
    commissionPaise:Number(data.commissionPaise ?? 0), sellerEarningPaise:Number(data.sellerEarningPaise ?? 0),
    invoiceUrl:String(data.invoiceUrl ?? ""), customOrderId:data.customOrderId ? String(data.customOrderId) : null,
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
  return onSnapshot(doc(db, "orders", orderId), (snapshot) => listener(snapshot.exists() ? mapOrder(snapshot.id, snapshot.data()) : null));
}

export async function updateOrderStatus(input: OrderStatusUpdateInput): Promise<void> {
  await callVercelBackend("updateOrderStatus", input);
}

export async function requestRefund(input: RefundRequestInput): Promise<void> {
  await callVercelBackend("requestOrderRefund", input);
}

export async function listStudioPayouts(studioId: string): Promise<readonly SellerPayout[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(collection(db, "payouts"), where("studioId", "==", studioId), orderBy("createdAt", "desc")));
  return snapshot.docs.map((item) => ({ payoutId: item.id, ...item.data() } as SellerPayout));
}

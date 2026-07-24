import { orderBy, where } from "firebase/firestore";
import { callSidraFunction } from "@/services/functionService";
import { getDocumentById, listDocuments } from "@/services/firestoreRepository";
import type { Order, OrderStatus } from "@/types/order";

export function getOrder(orderId: string): Promise<Order | null> {
  return getDocumentById<Order>("orders", orderId);
}

export function listCustomerOrders(customerId: string, maxResults = 50): Promise<readonly Order[]> {
  return listDocuments<Order>("orders", [where("customerId", "==", customerId), orderBy("createdAt", "desc")], maxResults);
}

export function listStudioOrders(studioId: string, maxResults = 50): Promise<readonly Order[]> {
  return listDocuments<Order>("orders", [where("studioId", "==", studioId), orderBy("createdAt", "desc")], maxResults);
}

export function appendOrderTimeline(input: {
  readonly orderId: string;
  readonly nextStatus: OrderStatus;
  readonly event: string;
}): Promise<{ readonly orderId: string; readonly status: OrderStatus }> {
  return callSidraFunction("appendOrderTimeline", input);
}

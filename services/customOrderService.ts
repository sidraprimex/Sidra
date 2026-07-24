import { orderBy, where } from "firebase/firestore";
import { callSidraFunction } from "@/services/functionService";
import { getDocumentById, listDocuments } from "@/services/firestoreRepository";
import type { BudgetRange, CustomOrderRequest } from "@/types/custom-order";

export function getCustomOrder(requestId: string): Promise<CustomOrderRequest | null> {
  return getDocumentById<CustomOrderRequest>("customOrders", requestId);
}

export function listCustomerCustomOrders(customerId: string, maxResults = 50): Promise<readonly CustomOrderRequest[]> {
  return listDocuments<CustomOrderRequest>("customOrders", [where("customerId", "==", customerId), orderBy("createdAt", "desc")], maxResults);
}

export function listStudioCustomOrders(studioId: string, maxResults = 50): Promise<readonly CustomOrderRequest[]> {
  return listDocuments<CustomOrderRequest>("customOrders", [where("assignedStudioId", "==", studioId), orderBy("createdAt", "desc")], maxResults);
}

export function createCustomOrderRequest(input: {
  readonly category: string;
  readonly description: string;
  readonly budgetRange: BudgetRange;
  readonly deadline: string | null;
  readonly referenceImageUrls: readonly string[];
}): Promise<{ readonly requestId: string }> {
  return callSidraFunction("createCustomOrderRequest", input);
}

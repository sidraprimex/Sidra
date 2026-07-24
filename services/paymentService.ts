import { where } from "firebase/firestore";
import { getDocumentById, listDocuments } from "@/services/firestoreRepository";
import type { Payment } from "@/types/payment";

export function getPayment(paymentId: string): Promise<Payment | null> {
  return getDocumentById<Payment>("payments", paymentId);
}

export async function getOrderPayment(orderId: string): Promise<Payment | null> {
  const payments = await listDocuments<Payment>("payments", [where("orderId", "==", orderId)], 1);
  return payments[0] ?? null;
}

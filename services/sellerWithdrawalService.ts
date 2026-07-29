import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type { SellerWithdrawal, WithdrawalMethod } from "@/types/phase7-orders";

export async function listSellerWithdrawals(studioId: string): Promise<readonly SellerWithdrawal[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(collection(db, "sellerWithdrawals"), where("studioId", "==", studioId), orderBy("createdAt", "desc")));
  return snapshot.docs.map((item) => ({ withdrawalId: item.id, ...item.data() } as SellerWithdrawal));
}

export async function requestSellerWithdrawal(input: {
  amountPaise: number;
  method: WithdrawalMethod;
  destination: Record<string, string>;
}): Promise<string> {
  const callable = httpsCallable<typeof input, { withdrawalId: string }>(requireFirebaseServices().functions, "requestSellerWithdrawal");
  return (await callable(input)).data.withdrawalId;
}

export async function reviewSellerWithdrawal(input: {
  withdrawalId: string;
  decision: "processing" | "paid" | "rejected";
  paymentReference?: string;
  adminNote?: string;
}): Promise<void> {
  const callable = httpsCallable<typeof input, { accepted: true }>(requireFirebaseServices().functions, "reviewSellerWithdrawal");
  await callable(input);
}

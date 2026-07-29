import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type { SellerWithdrawal, WithdrawalMethod } from "@/types/phase7-orders";

export async function listSellerWithdrawals(studioId: string): Promise<readonly SellerWithdrawal[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(collection(db, "sellerWithdrawals"), where("studioId", "==", studioId)));
  return snapshot.docs.map((item) => ({ withdrawalId: item.id, ...item.data() } as SellerWithdrawal));
}

export async function requestSellerWithdrawal(input: {
  studioId: string;
  amountPaise: number;
  method: WithdrawalMethod;
  destination: Record<string, string>;
}): Promise<string> {
  const { auth, db } = requireFirebaseServices();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in again before requesting a withdrawal.");
  if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise < 50000) throw new Error("Minimum withdrawal is ₹500.");
  if (input.method === "upi" && !/^[\w.-]{2,}@[A-Za-z]{2,}$/.test(input.destination.upiId?.trim() ?? "")) throw new Error("Enter a valid UPI ID.");
  if (input.method !== "upi" && (
    (input.destination.accountHolderName?.trim().length ?? 0) < 2
    || !/^\d{6,20}$/.test(input.destination.accountNumber?.trim() ?? "")
    || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(input.destination.ifsc?.trim().toUpperCase() ?? "")
  )) throw new Error("Complete valid bank details are required.");
  const created = await addDoc(collection(db, "sellerWithdrawals"), {
    studioId: input.studioId,
    sellerUid: user.uid,
    amountPaise: input.amountPaise,
    method: input.method,
    destination: input.method === "upi"
      ? { upiId: input.destination.upiId.trim().toLowerCase() }
      : {
          accountHolderName: input.destination.accountHolderName.trim(),
          accountNumber: input.destination.accountNumber.trim(),
          ifsc: input.destination.ifsc.trim().toUpperCase(),
          bankName: input.destination.bankName?.trim() ?? "",
        },
    status: "pending",
    paymentReference: null,
    adminNote: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

export async function reviewSellerWithdrawal(input: {
  withdrawalId: string;
  decision: "processing" | "paid" | "rejected";
  paymentReference?: string;
  adminNote?: string;
}): Promise<void> {
  const paymentReference = input.paymentReference?.trim() ?? "";
  const adminNote = input.adminNote?.trim() ?? "";
  if (input.decision === "paid" && paymentReference.length < 4) throw new Error("UTR or payment reference is required.");
  if (input.decision === "rejected" && adminNote.length < 3) throw new Error("Rejection reason is required.");
  const { auth, db } = requireFirebaseServices();
  if (!auth.currentUser) throw new Error("Admin session expired.");
  await updateDoc(doc(db, "sellerWithdrawals", input.withdrawalId), {
    status: input.decision,
    paymentReference: input.decision === "paid" ? paymentReference : null,
    adminNote: adminNote || null,
    reviewedBy: auth.currentUser.uid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

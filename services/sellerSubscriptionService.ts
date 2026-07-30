import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { requireFirebaseServices } from "@/services/firebaseClient";
import {
  type SellerSubscriptionPlan,
  type SellerSubscriptionRequest,
  type SellerInstallmentSchedule,
} from "@/types/seller-subscription";
import { getSellerCommerceSettings } from "@/services/businessConfigurationService";

function normalize(id: string, data: Record<string, unknown>): SellerSubscriptionRequest {
  return { id, ...data } as unknown as SellerSubscriptionRequest;
}

export function watchStudioSubscriptionRequests(
  studioId: string,
  sellerUid: string,
  onValue: (values: readonly SellerSubscriptionRequest[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const { db } = requireFirebaseServices();
  return onSnapshot(
    query(
      collection(db, "sellerSubscriptionRequests"),
      where("studioId", "==", studioId),
      where("sellerUid", "==", sellerUid),
      limit(20),
    ),
    (snapshot) => onValue(snapshot.docs.map((item) => normalize(item.id, item.data()))),
    onError,
  );
}

export function watchSellerInstallmentSchedule(
  studioId: string,
  onValue: (value: SellerInstallmentSchedule | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const { db } = requireFirebaseServices();
  return onSnapshot(
    doc(db, "sellerInstallmentSchedules", studioId),
    (snapshot) => onValue(snapshot.exists() ? snapshot.data() as SellerInstallmentSchedule : null),
    onError,
  );
}

export async function submitSellerSubscriptionRequest(params: {
  readonly studioId: string;
  readonly sellerUid: string;
  readonly plan: Exclude<SellerSubscriptionPlan, "free">;
  readonly paymentReference: string;
}): Promise<string> {
  const { db } = requireFirebaseServices();
  const reference = params.paymentReference.trim();
  if (reference.length < 4) throw new Error("Enter a valid UTR/payment reference.");
  const settings = await getSellerCommerceSettings();
  const definition = settings.plans.find((item) => item.id === params.plan && item.enabled);
  if (!definition) throw new Error("This plan is not currently available.");
  if (definition.monthlyFeePaise <= 0 && params.plan === "custom") {
    throw new Error("Ask Sidra admin to configure your custom plan price first.");
  }
  const created = await addDoc(collection(db, "sellerSubscriptionRequests"), {
    studioId: params.studioId,
    sellerUid: params.sellerUid,
    plan: params.plan,
    monthlyFeePaise: definition.monthlyFeePaise,
    maximumCommissionBasisPoints: definition.maximumCommissionBasisPoints,
    paymentReference: reference.slice(0, 180),
    status: "pending",
    adminNote: null,
    reviewedBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

export async function reviewSellerSubscriptionRequest(params: {
  readonly requestId: string;
  readonly adminUid: string;
  readonly decision: "approved" | "rejected";
  readonly note?: string;
}): Promise<void> {
  const { db } = requireFirebaseServices();
  await runTransaction(db, async (transaction) => {
    const requestRef = doc(db, "sellerSubscriptionRequests", params.requestId);
    const snapshot = await transaction.get(requestRef);
    if (!snapshot.exists()) throw new Error("Subscription request not found.");
    const request = normalize(snapshot.id, snapshot.data());
    if (request.status !== "pending") throw new Error("This request has already been reviewed.");

    transaction.update(requestRef, {
      status: params.decision,
      adminNote: params.note?.trim().slice(0, 1000) || null,
      reviewedBy: params.adminUid,
      updatedAt: serverTimestamp(),
    });

    if (params.decision === "approved") {
      transaction.update(doc(db, "studios", request.studioId), {
        subscriptionPlan: request.plan,
        subscriptionTier: request.plan === "luxury" ? "premium" : "professional",
        subscriptionMonthlyFeePaise: request.monthlyFeePaise,
        commissionRateBasisPoints: request.maximumCommissionBasisPoints,
        subscriptionStatus: "active",
        subscriptionActivatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const notificationRef = doc(collection(db, "notifications"));
    transaction.set(notificationRef, {
      recipientUid: request.sellerUid,
      type: params.decision === "approved" ? "subscriptionApproved" : "subscriptionRejected",
      title: params.decision === "approved" ? "Seller plan activated" : "Seller plan payment needs attention",
      body: params.decision === "approved"
        ? `${request.plan} plan is now active for your Studio.`
        : params.note?.trim() || "Your subscription payment could not be verified.",
      actionUrl: "/studio-admin/subscription",
      read: false,
      studioId: request.studioId,
      createdAt: serverTimestamp(),
    });
  });
}

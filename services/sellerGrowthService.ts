import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { callVercelBackend } from "@/services/vercelBackendService";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type { CartLineItem } from "@/types/phase6-commerce";
import type {
  AppliedSellerCoupon,
  CouponDiscountType,
  CustomerSegment,
  CustomerSegmentRule,
  SellerAnalyticsSummary,
  SellerCampaign,
  SellerCoupon,
} from "@/types/phase11-seller-growth";

export async function getSellerAnalyticsSummary(
  studioId: string,
): Promise<SellerAnalyticsSummary> {
  return callVercelBackend("getSellerAnalyticsSummary", { studioId });
}

function currentUserId(): string {
  const user = requireFirebaseServices().auth.currentUser;
  if (!user) throw new Error("Your session expired. Sign in again.");
  return user.uid;
}

function timestampValue(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  return 0;
}

async function listByStudio<T>(
  collectionName: string,
  idField: "couponId" | "segmentId" | "campaignId",
  studioId: string,
): Promise<readonly T[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(
    query(
      collection(db, collectionName),
      where("studioId", "==", studioId),
      limit(100),
    ),
  );
  return snapshot.docs
    .map((item) => ({
      ...item.data(),
      [idField]: item.id,
    }) as T & { createdAt?: unknown })
    .sort(
      (left, right) =>
        timestampValue(right.createdAt) -
        timestampValue(left.createdAt),
    );
}

export const listSellerCoupons = (
  studioId: string,
): Promise<readonly SellerCoupon[]> =>
  listByStudio<SellerCoupon>(
    "sellerCoupons",
    "couponId",
    studioId,
  );

export const listCustomerSegments = (
  studioId: string,
): Promise<readonly CustomerSegment[]> =>
  listByStudio<CustomerSegment>(
    "customerSegments",
    "segmentId",
    studioId,
  );

export const listSellerCampaigns = (
  studioId: string,
): Promise<readonly SellerCampaign[]> =>
  listByStudio<SellerCampaign>(
    "sellerCampaigns",
    "campaignId",
    studioId,
  );

export function normalizeSellerCouponCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function couponDocumentId(code: string): string {
  const normalized = normalizeSellerCouponCode(code);
  if (!/^[A-Z0-9_-]{3,24}$/.test(normalized)) {
    throw new Error(
      "Coupon code must be 3–24 letters, numbers, hyphens or underscores.",
    );
  }
  return normalized.toLowerCase();
}

export async function saveSellerCoupon(input: {
  readonly studioId: string;
  readonly code: string;
  readonly title: string;
  readonly discountType: CouponDiscountType;
  readonly discountValue: number;
  readonly minimumOrderPaise: number;
  readonly active: boolean;
}): Promise<{ couponId: string }> {
  const { db } = requireFirebaseServices();
  const createdBy = currentUserId();
  const couponId = couponDocumentId(input.code);
  const code = normalizeSellerCouponCode(input.code);
  const title = input.title.trim();
  const discountValue = Math.trunc(input.discountValue);
  const minimumOrderPaise = Math.max(
    0,
    Math.trunc(input.minimumOrderPaise),
  );

  if (title.length < 3 || title.length > 100) {
    throw new Error("Coupon title must be 3–100 characters.");
  }
  if (
    input.discountType === "percentage" &&
    (discountValue < 1 || discountValue > 90)
  ) {
    throw new Error("Percentage discount must be between 1% and 90%.");
  }
  if (
    input.discountType === "fixed" &&
    (discountValue < 100 || discountValue > 100_000_000)
  ) {
    throw new Error("Fixed discount must be between ₹1 and ₹10,00,000.");
  }

  const couponRef = doc(db, "sellerCoupons", couponId);
  await runTransaction(db, async (transaction) => {
    if ((await transaction.get(couponRef)).exists()) {
      throw new Error(
        "This coupon code already exists. Choose a different code.",
      );
    }
    transaction.set(couponRef, {
      couponId,
      studioId: input.studioId,
      code,
      title,
      discountType: input.discountType,
      discountValue,
      minimumOrderPaise,
      active: input.active,
      usedCount: 0,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  return { couponId };
}

export async function setSellerCouponActive(
  couponId: string,
  active: boolean,
): Promise<void> {
  const { db } = requireFirebaseServices();
  await updateDoc(doc(db, "sellerCoupons", couponId), {
    active,
    updatedAt: serverTimestamp(),
  });
}

function discountForCoupon(
  coupon: SellerCoupon,
  eligibleSubtotalPaise: number,
): number {
  if (coupon.discountType === "percentage") {
    return Math.floor(
      eligibleSubtotalPaise *
        Math.min(90, Math.max(0, coupon.discountValue)) /
        100,
    );
  }
  return Math.min(
    eligibleSubtotalPaise,
    Math.max(0, coupon.discountValue),
  );
}

export async function validateSellerCoupon(
  codeInput: string,
  items: readonly CartLineItem[],
): Promise<AppliedSellerCoupon> {
  const { db } = requireFirebaseServices();
  const couponId = couponDocumentId(codeInput);
  const snapshot = await getDoc(
    doc(db, "sellerCoupons", couponId),
  );
  if (!snapshot.exists()) throw new Error("Coupon code not found.");

  const coupon = {
    ...snapshot.data(),
    couponId: snapshot.id,
  } as SellerCoupon;
  if (!coupon.active) throw new Error("This coupon is not active.");

  const eligibleSubtotalPaise = items
    .filter((item) => item.studioId === coupon.studioId)
    .reduce(
      (sum, item) =>
        sum + item.unitPricePaise * item.quantity,
      0,
    );
  if (eligibleSubtotalPaise <= 0) {
    throw new Error(
      "This coupon does not apply to products in your cart.",
    );
  }
  if (eligibleSubtotalPaise < coupon.minimumOrderPaise) {
    throw new Error(
      `Add ₹${Math.ceil(
        (coupon.minimumOrderPaise - eligibleSubtotalPaise) / 100,
      )} more from this seller to use the coupon.`,
    );
  }

  const discountPaise = discountForCoupon(
    coupon,
    eligibleSubtotalPaise,
  );
  if (discountPaise <= 0) {
    throw new Error("This coupon does not provide a valid discount.");
  }
  return {
    couponId,
    studioId: coupon.studioId,
    code: coupon.code,
    title: coupon.title,
    discountPaise,
  };
}

export async function saveCustomerSegment(input: {
  readonly studioId: string;
  readonly name: string;
  readonly description: string;
  readonly rule: CustomerSegmentRule;
}): Promise<{ segmentId: string }> {
  const { db } = requireFirebaseServices();
  const createdBy = currentUserId();
  const segmentRef = doc(collection(db, "customerSegments"));
  const name = input.name.trim();
  const description = input.description.trim();
  if (name.length < 3 || name.length > 100) {
    throw new Error("Segment name must be 3–100 characters.");
  }
  if (description.length < 3 || description.length > 500) {
    throw new Error("Description must be 3–500 characters.");
  }
  await setDoc(segmentRef, {
    segmentId: segmentRef.id,
    studioId: input.studioId,
    name,
    description,
    rule: input.rule,
    customerCount: 0,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { segmentId: segmentRef.id };
}

export async function saveSellerCampaign(input: {
  readonly studioId: string;
  readonly name: string;
  readonly subject: string;
  readonly message: string;
  readonly segmentId: string;
}): Promise<{ campaignId: string }> {
  const { db } = requireFirebaseServices();
  const createdBy = currentUserId();
  const segmentSnapshot = await getDoc(
    doc(db, "customerSegments", input.segmentId),
  );
  if (
    !segmentSnapshot.exists() ||
    segmentSnapshot.data().studioId !== input.studioId
  ) {
    throw new Error("Select a valid customer segment.");
  }
  const name = input.name.trim();
  const subject = input.subject.trim();
  const message = input.message.trim();
  if (name.length < 3 || name.length > 100) {
    throw new Error("Campaign name must be 3–100 characters.");
  }
  if (subject.length < 3 || subject.length > 140) {
    throw new Error("Subject must be 3–140 characters.");
  }
  if (message.length < 10 || message.length > 5000) {
    throw new Error("Message must be 10–5000 characters.");
  }

  const campaignRef = doc(collection(db, "sellerCampaigns"));
  await setDoc(campaignRef, {
    campaignId: campaignRef.id,
    studioId: input.studioId,
    name,
    subject,
    message,
    segmentId: input.segmentId,
    status: "draft",
    sentCount: 0,
    deliveredCount: 0,
    openedCount: 0,
    clickedCount: 0,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { campaignId: campaignRef.id };
}

export function couponDiscountLabel(
  coupon: Pick<
    SellerCoupon,
    "discountType" | "discountValue"
  >,
): string {
  return coupon.discountType === "percentage"
    ? `${coupon.discountValue}% off`
    : `₹${(coupon.discountValue / 100).toLocaleString(
        "en-IN",
      )} off`;
}

export type SellerGrowthRecord =
  | (DocumentData & SellerCoupon)
  | (DocumentData & CustomerSegment)
  | (DocumentData & SellerCampaign);

import { where } from "firebase/firestore";
import { getDocumentById, listDocuments, setDocument, updateDocument } from "@/services/firestoreRepository";
import type { Coupon } from "@/types/finance";

export function getCoupon(couponId: string): Promise<Coupon | null> {
  return getDocumentById<Coupon>("coupons", couponId);
}

export async function getActiveCouponByCode(code: string): Promise<Coupon | null> {
  const coupons = await listDocuments<Coupon>("coupons", [where("code", "==", code.trim().toUpperCase()), where("active", "==", true)], 1);
  return coupons[0] ?? null;
}

export function saveCoupon(coupon: Coupon): Promise<void> {
  return setDocument("coupons", coupon.couponId, coupon);
}

export function updateCoupon(couponId: string, value: Partial<Coupon>): Promise<void> {
  return updateDocument<Coupon>("coupons", couponId, value);
}

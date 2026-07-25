import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type { CustomerSegment, SellerAnalyticsSummary, SellerCampaign, SellerCoupon } from "@/types/phase11-seller-growth";

export async function getSellerAnalyticsSummary(studioId: string): Promise<SellerAnalyticsSummary> {
  const call = httpsCallable<{ studioId: string }, SellerAnalyticsSummary>(requireFirebaseServices().functions, "getSellerAnalyticsSummary");
  return (await call({ studioId })).data;
}
async function listByStudio<T>(collectionName: string, studioId: string): Promise<readonly T[]> {
  const { db } = requireFirebaseServices();
  const snap = await getDocs(query(collection(db, collectionName), where("studioId", "==", studioId), orderBy("createdAt", "desc"), limit(100)));
  return snap.docs.map((d) => ({ ...d.data(), [`${collectionName === "sellerCoupons" ? "coupon" : collectionName === "customerSegments" ? "segment" : "campaign"}Id`]: d.id } as T));
}
export const listSellerCoupons = (studioId: string) => listByStudio<SellerCoupon>("sellerCoupons", studioId);
export const listCustomerSegments = (studioId: string) => listByStudio<CustomerSegment>("customerSegments", studioId);
export const listSellerCampaigns = (studioId: string) => listByStudio<SellerCampaign>("sellerCampaigns", studioId);

export async function saveSellerCoupon(input: Record<string, unknown>): Promise<{ couponId: string }> {
  const call = httpsCallable<Record<string, unknown>, { couponId: string }>(requireFirebaseServices().functions, "saveSellerCoupon");
  return (await call(input)).data;
}
export async function saveCustomerSegment(input: Record<string, unknown>): Promise<{ segmentId: string }> {
  const call = httpsCallable<Record<string, unknown>, { segmentId: string }>(requireFirebaseServices().functions, "saveCustomerSegment");
  return (await call(input)).data;
}
export async function saveSellerCampaign(input: Record<string, unknown>): Promise<{ campaignId: string }> {
  const call = httpsCallable<Record<string, unknown>, { campaignId: string }>(requireFirebaseServices().functions, "saveSellerCampaign");
  return (await call(input)).data;
}

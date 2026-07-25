import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function studio(request: { auth?: { uid: string; token: Record<string, unknown> } }, requested: string): string {
  if (!request.auth?.uid || request.auth.token.role !== "seller") throw new HttpsError("permission-denied", "Seller access required.");
  const current = typeof request.auth.token.studioId === "string" ? request.auth.token.studioId : "";
  if (!current || current !== requested) throw new HttpsError("permission-denied", "Studio access denied.");
  return current;
}

export const getSellerAnalyticsSummary = onCall(async (request) => {
  const studioId = String(request.data?.studioId ?? ""); studio(request, studioId);
  const data = (await getFirestore().collection("sellerAnalyticsSummary").doc(studioId).get()).data() ?? {};
  return { grossSalesPaise:Number(data.grossSalesPaise??0), netSalesPaise:Number(data.netSalesPaise??0), orderCount:Number(data.orderCount??0), customOrderCount:Number(data.customOrderCount??0), averageOrderValuePaise:Number(data.averageOrderValuePaise??0), conversionRate:Number(data.conversionRate??0), repeatCustomerRate:Number(data.repeatCustomerRate??0), refundRate:Number(data.refundRate??0), wishlistCount:Number(data.wishlistCount??0), followerCount:Number(data.followerCount??0) };
});

export const saveSellerCoupon = onCall(async (request) => {
  const studioId=String(request.data?.studioId??""); studio(request,studioId);
  const code=String(request.data?.code??"").trim().toUpperCase().replace(/[^A-Z0-9_-]/g,"").slice(0,24);
  const title=String(request.data?.title??"").trim(); const value=Number(request.data?.discountValue??0);
  if(code.length<3||title.length<3||value<=0||value>90) throw new HttpsError("invalid-argument","Invalid coupon.");
  const ref=getFirestore().collection("sellerCoupons").doc();
  await ref.set({ studioId, code, title, discountType:"percentage", discountValue:value, minimumOrderPaise:Number(request.data?.minimumOrderPaise??0), active:Boolean(request.data?.active), usedCount:0, createdAt:FieldValue.serverTimestamp(), updatedAt:FieldValue.serverTimestamp() });
  return { couponId:ref.id };
});

export const saveCustomerSegment = onCall(async (request) => {
  const studioId=String(request.data?.studioId??""); studio(request,studioId);
  const name=String(request.data?.name??"").trim(); if(name.length<3) throw new HttpsError("invalid-argument","Invalid segment.");
  const ref=getFirestore().collection("customerSegments").doc();
  await ref.set({ studioId, name, description:String(request.data?.description??"").trim(), rule:String(request.data?.rule??"all"), customerCount:0, createdAt:FieldValue.serverTimestamp(), updatedAt:FieldValue.serverTimestamp() });
  return { segmentId:ref.id };
});

export const saveSellerCampaign = onCall(async (request) => {
  const studioId=String(request.data?.studioId??""); studio(request,studioId);
  const name=String(request.data?.name??"").trim(); const subject=String(request.data?.subject??"").trim(); const message=String(request.data?.message??"").trim(); const segmentId=String(request.data?.segmentId??"");
  if(name.length<3||subject.length<3||message.length<10||!segmentId) throw new HttpsError("invalid-argument","Invalid campaign.");
  const segment=await getFirestore().collection("customerSegments").doc(segmentId).get();
  if(!segment.exists||segment.data()?.studioId!==studioId) throw new HttpsError("permission-denied","Segment denied.");
  const ref=getFirestore().collection("sellerCampaigns").doc();
  await ref.set({ studioId,name,subject,message,segmentId,status:"draft",sentCount:0,deliveredCount:0,openedCount:0,clickedCount:0,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp() });
  return { campaignId:ref.id };
});

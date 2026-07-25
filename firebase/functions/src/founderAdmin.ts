import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function founder(request: { auth?: { uid: string; token: Record<string, unknown> } }): string {
  if (!request.auth?.uid || request.auth.token.role !== "founder") throw new HttpsError("permission-denied", "Founder access required.");
  return request.auth.uid;
}
function validPercent(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}
function validAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export const savePlatformContent = onCall(async (request) => {
  const uid = founder(request);
  const namespace = String(request.data?.namespace ?? "").trim().toLowerCase();
  const key = String(request.data?.key ?? "").trim().toLowerCase();
  const value = String(request.data?.value ?? "");
  const description = String(request.data?.description ?? "").trim();
  const status = String(request.data?.status ?? "draft");
  if (!namespace || !key || !value || !["draft", "published", "archived"].includes(status)) throw new HttpsError("invalid-argument", "Valid content data required.");
  const db = getFirestore();
  const id = String(request.data?.contentId ?? `${namespace}.${key}`).replace(/[^a-z0-9._-]/g, "-");
  const ref = db.collection("platformContent").doc(id);
  const old = await ref.get();
  const batch = db.batch();
  batch.set(ref, { namespace, key, value, description, status, updatedBy: uid, createdAt: old.exists ? old.data()?.createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  batch.set(db.collection("adminAuditLogs").doc(), { actorId: uid, actorRole: "founder", action: old.exists ? "platformContent.update" : "platformContent.create", entityType: "platformContent", entityId: id, createdAt: FieldValue.serverTimestamp() });
  await batch.commit();
  return { contentId: id };
});

export const saveCommerceSettings = onCall(async (request) => {
  const uid = founder(request);
  const d = request.data ?? {};
  if (!validPercent(d.platformFeePercent) || !validPercent(d.defaultSellerCommissionPercent) || !validPercent(d.customOrderDepositPercent) || !validPercent(d.maximumDiscountPercent) || !validAmount(d.minimumPayoutPaise) || !validAmount(d.sellerSubscriptionPricePaise) || !validAmount(d.payoutHoldDays) || !validAmount(d.customerCancellationWindowMinutes)) throw new HttpsError("invalid-argument", "Invalid commerce settings.");
  const db = getFirestore();
  const ref = db.collection("platformSettings").doc("commerce");
  const after = { currency: "INR", platformFeePercent: d.platformFeePercent, defaultSellerCommissionPercent: d.defaultSellerCommissionPercent, minimumPayoutPaise: d.minimumPayoutPaise, payoutHoldDays: d.payoutHoldDays, customOrderDepositPercent: d.customOrderDepositPercent, maximumDiscountPercent: d.maximumDiscountPercent, sellerSubscriptionEnabled: Boolean(d.sellerSubscriptionEnabled), sellerSubscriptionPricePaise: d.sellerSubscriptionPricePaise, customerCancellationWindowMinutes: d.customerCancellationWindowMinutes, updatedBy: uid, updatedAt: FieldValue.serverTimestamp() };
  const batch = db.batch(); batch.set(ref, after, { merge: true }); batch.set(db.collection("adminAuditLogs").doc(), { actorId: uid, actorRole: "founder", action: "commerceSettings.update", entityType: "platformSettings", entityId: "commerce", createdAt: FieldValue.serverTimestamp() }); await batch.commit();
  return { accepted: true };
});

export const getFounderControlCenterSummary = onCall(async (request) => {
  founder(request);
  const db = getFirestore();
  const [a,s,p,o,c,r,n] = await Promise.all([
    db.collection("sellerApplications").where("status","==","pending").count().get(),
    db.collection("sellers").where("status","==","active").count().get(),
    db.collection("products").where("status","==","published").count().get(),
    db.collection("orders").where("orderStatus","in",["placed","accepted","inProduction","qualityCheck","packaged","readyToShip","shipped","inTransit","outForDelivery"]).count().get(),
    db.collection("customOrders").where("status","in",["submitted","sellerReview","quoted","depositPending","inProduction","proofReady","customerReview"]).count().get(),
    db.collection("reviews").where("status","==","pending").count().get(),
    db.collection("founderAlerts").where("read","==",false).count().get()
  ]);
  const f = (await db.collection("financeSummary").doc("current").get()).data() ?? {};
  return { pendingSellerApplications:a.data().count, activeSellers:s.data().count, publishedProducts:p.data().count, pendingOrders:o.data().count, pendingCustomOrders:c.data().count, pendingReviews:r.data().count, unreadFounderAlerts:n.data().count, finance:{ grossRevenuePaise:Number(f.grossRevenuePaise??0), platformRevenuePaise:Number(f.platformRevenuePaise??0), sellerPayablePaise:Number(f.sellerPayablePaise??0), refundsPaise:Number(f.refundsPaise??0), pendingPayoutPaise:Number(f.pendingPayoutPaise??0), completedPayoutPaise:Number(f.completedPayoutPaise??0), orderCount:Number(f.orderCount??0), customOrderCount:Number(f.customOrderCount??0) } };
});

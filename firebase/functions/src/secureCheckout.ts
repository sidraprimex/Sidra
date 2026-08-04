import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

export interface VerifiedCheckoutItem {
  productId: string; productSlug: string; productName: string; imageUrl: string | null;
  studioId: string; studioName: string; sellerUid: string | null;
  variantId: string | null; variantLabel: string | null;
  unitPricePaise: number; quantity: number;
}

export interface VerifiedCheckout {
  addressId: string;
  shippingAddress: Record<string, unknown>;
  customer: { name: string; email: string; phone: string };
  items: VerifiedCheckoutItem[];
  subtotalPaise: number; shippingPaise: number; discountPaise: number; totalPaise: number;
  couponId: string | null; couponCode: string | null; couponStudioId: string | null;
}

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function futureOrUnset(value: unknown): boolean {
  if (!value) return true;
  if (typeof value === "object" && value && "toDate" in value && typeof (value as {toDate?:unknown}).toDate === "function") return (value as {toDate:()=>Date}).toDate().getTime() >= Date.now();
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) && parsed >= Date.now();
}

export async function resolveSecureCheckout(customerId: string, raw: unknown): Promise<VerifiedCheckout> {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const submittedItems = Array.isArray(input.items) ? input.items : [];
  const addressId = text(input.addressId);
  if (!addressId || submittedItems.length < 1 || submittedItems.length > 50) {
    throw new HttpsError("invalid-argument", "Address and cart products are required.");
  }
  const db = getFirestore();
  const [addressBook, user, logistics] = await Promise.all([
    db.collection("addressBooks").doc(customerId).get(),
    db.collection("users").doc(customerId).get(),
    db.collection("settings").doc("logistics").get(),
  ]);
  const addresses = addressBook.data()?.addresses;
  const address = Array.isArray(addresses) ? addresses.find((value) => value && typeof value === "object" && text((value as Record<string, unknown>).id) === addressId) : null;
  if (!address) throw new HttpsError("failed-precondition", "Selected delivery address no longer exists.");

  const verified: VerifiedCheckoutItem[] = [];
  for (const submitted of submittedItems) {
    const value = (submitted && typeof submitted === "object" ? submitted : {}) as Record<string, unknown>;
    const productId = text(value.productId);
    const quantity = Number(value.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw new HttpsError("invalid-argument", "Product quantity must be between 1 and 20.");
    const productSnapshot = await db.collection("products").doc(productId).get();
    const product = productSnapshot.data() ?? {};
    const price = Number(product.salePricePaise ?? product.pricePaise ?? 0);
    if (!productSnapshot.exists || product.status !== "published" || !Number.isSafeInteger(price) || price <= 0) throw new HttpsError("failed-precondition", "A product is no longer available.");
    if (product.inventoryMode === "finite" && quantity > Number(product.inventoryCount ?? 0)) throw new HttpsError("failed-precondition", "Requested quantity is no longer available.");
    const studioId = text(product.studioId);
    const studioSnapshot = await db.collection("studios").doc(studioId).get();
    const studio = studioSnapshot.data() ?? {};
    verified.push({
      productId, productSlug: text(product.slug), productName: text(product.name) || "Sidra product",
      imageUrl: text(product.heroImageUrl) || null, studioId,
      studioName: text(studio.name) || text(value.studioName) || "Sidra Studio",
      sellerUid: text(studio.ownerUid) || null, variantId: text(value.variantId) || null,
      variantLabel: text(value.variantLabel) || null, unitPricePaise: price, quantity,
    });
  }
  const subtotalPaise = verified.reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
  const studioCount = new Set(verified.map((item) => item.studioId)).size;
  const shippingPaise = logistics.data()?.shippingCostAllocation === "buyerPaid" ? studioCount * 9900 : 0;
  let discountPaise = 0;
  const couponId: string | null = text(input.couponId) || null;
  let couponCode: string | null = null;
  let couponStudioId: string | null = null;
  if (couponId) {
    const couponSnapshot = await db.collection("sellerCoupons").doc(couponId).get();
    const coupon = couponSnapshot.data() ?? {};
    couponCode = text(coupon.code);
    couponStudioId = text(coupon.studioId);
    const eligibleSubtotal = verified.filter((item) => item.studioId === couponStudioId).reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
    const valid = couponSnapshot.exists && coupon.active === true && eligibleSubtotal >= Number(coupon.minimumOrderPaise ?? 0) && futureOrUnset(coupon.endsAt);
    if (!valid) throw new HttpsError("failed-precondition", "Coupon is no longer valid.");
    discountPaise = coupon.discountType === "percentage" ? Math.floor(eligibleSubtotal * Math.min(90, Math.max(0, Number(coupon.discountValue ?? 0))) / 100) : Math.min(eligibleSubtotal, Math.max(0, Number(coupon.discountValue ?? 0)));
  }
  const customer = user.data() ?? {};
  const addressMap = address as Record<string, unknown>;
  return {
    addressId, shippingAddress: addressMap,
    customer: { name: text(customer.fullName) || text(addressMap.name) || "Customer", email: text(customer.email), phone: text(customer.phone) || text(addressMap.phone) },
    items: verified, subtotalPaise, shippingPaise, discountPaise,
    totalPaise: subtotalPaise + shippingPaise - discountPaise,
    couponId, couponCode, couponStudioId,
  };
}

export const checkoutTimestamp = () => FieldValue.serverTimestamp();

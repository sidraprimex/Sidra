import { sidraAdminDb } from "@/lib/server/firebaseAdmin";

export interface ServerCheckoutItem {
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  studioId: string;
  studioName: string;
  sellerUid: string | null;
  commissionRateBasisPoints: number;
  makingCostPaise: number;
  variantId: string | null;
  variantLabel: string | null;
  unitPricePaise: number;
  quantity: number;
}
export interface ServerCheckout {
  addressId: string;
  shippingAddress: Record<string, unknown>;
  customer: { name: string; email: string; phone: string };
  items: ServerCheckoutItem[];
  subtotalPaise: number;
  shippingPaise: number;
  discountPaise: number;
  totalPaise: number;
  couponId: string | null;
  couponCode: string | null;
  couponStudioId: string | null;
}
function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
function future(value: unknown): boolean {
  if (!value) return true;
  if (
    typeof value === "object" &&
    value &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  )
    return (value as { toDate: () => Date }).toDate().getTime() >= Date.now();
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) && parsed >= Date.now();
}

export async function resolveServerCheckout(
  customerId: string,
  raw: unknown,
): Promise<ServerCheckout> {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const submitted = Array.isArray(input.items) ? input.items : [];
  const addressId = text(input.addressId);
  if (!addressId || submitted.length < 1 || submitted.length > 50)
    throw new Error("ADDRESS_AND_CART_REQUIRED");
  const db = sidraAdminDb();
  const [book, user, logistics] = await Promise.all([
    db.collection("addressBooks").doc(customerId).get(),
    db.collection("users").doc(customerId).get(),
    db.collection("settings").doc("logistics").get(),
  ]);
  const addresses = book.data()?.addresses;
  const address = Array.isArray(addresses)
    ? addresses.find(
        (item) =>
          item &&
          typeof item === "object" &&
          text((item as Record<string, unknown>).id) === addressId,
      )
    : null;
  if (!address) throw new Error("DELIVERY_ADDRESS_MISSING");
  const items: ServerCheckoutItem[] = [];
  for (const submittedItem of submitted) {
    const value = (
      submittedItem && typeof submittedItem === "object" ? submittedItem : {}
    ) as Record<string, unknown>;
    const productId = text(value.productId);
    const quantity = Number(value.quantity);
    if (
      !productId ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 20
    )
      throw new Error("INVALID_QUANTITY");
    const [productSnap, costingSnap] = await Promise.all([
      db.collection("products").doc(productId).get(),
      db.collection("productCostings").doc(productId).get(),
    ]);
    const product = productSnap.data() ?? {};
    const price = Number(product.salePricePaise ?? product.pricePaise ?? 0);
    if (
      !productSnap.exists ||
      product.status !== "published" ||
      !Number.isSafeInteger(price) ||
      price <= 0
    )
      throw new Error("PRODUCT_UNAVAILABLE");
    if (
      product.inventoryMode === "finite" &&
      quantity > Number(product.inventoryCount ?? 0)
    )
      throw new Error("INSUFFICIENT_INVENTORY");
    const studioId = text(product.studioId);
    const studio =
      (await db.collection("studios").doc(studioId).get()).data() ?? {};
    items.push({
      productId,
      productSlug: text(product.slug),
      productName: text(product.name) || "Sidra product",
      imageUrl: text(product.heroImageUrl) || null,
      studioId,
      studioName: text(studio.name) || "Sidra Studio",
      sellerUid: text(studio.ownerUid) || null,
      commissionRateBasisPoints: Math.max(
        0,
        Math.min(10000, Number(studio.commissionRateBasisPoints ?? 1200)),
      ),
      makingCostPaise: Math.max(
        0,
        Number(costingSnap.data()?.makingCostPaise ?? 0),
      ),
      variantId: text(value.variantId) || null,
      variantLabel: text(value.variantLabel) || null,
      unitPricePaise: price,
      quantity,
    });
  }
  const subtotalPaise = items.reduce(
    (sum, item) => sum + item.unitPricePaise * item.quantity,
    0,
  );
  const shippingPaise =
    logistics.data()?.shippingCostAllocation === "buyerPaid"
      ? new Set(items.map((item) => item.studioId)).size * 9900
      : 0;
  const couponId = text(input.couponId) || null;
  let couponCode: string | null = null;
  let couponStudioId: string | null = null;
  let discountPaise = 0;
  if (couponId) {
    const snap = await db.collection("sellerCoupons").doc(couponId).get();
    const coupon = snap.data() ?? {};
    couponCode = text(coupon.code);
    couponStudioId = text(coupon.studioId);
    const eligible = items
      .filter((item) => item.studioId === couponStudioId)
      .reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
    if (
      !snap.exists ||
      coupon.active !== true ||
      eligible < Number(coupon.minimumOrderPaise ?? 0) ||
      !future(coupon.endsAt)
    )
      throw new Error("COUPON_INVALID");
    discountPaise =
      coupon.discountType === "percentage"
        ? Math.floor(
            (eligible *
              Math.min(90, Math.max(0, Number(coupon.discountValue ?? 0)))) /
              100,
          )
        : Math.min(eligible, Math.max(0, Number(coupon.discountValue ?? 0)));
  }
  const profile = user.data() ?? {};
  const a = address as Record<string, unknown>;
  return {
    addressId,
    shippingAddress: a,
    customer: {
      name: text(profile.fullName) || text(a.name) || "Customer",
      email: text(profile.email),
      phone: text(profile.phone) || text(a.phone),
    },
    items,
    subtotalPaise,
    shippingPaise,
    discountPaise,
    totalPaise: subtotalPaise + shippingPaise - discountPaise,
    couponId,
    couponCode,
    couponStudioId,
  };
}

import {
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type { CartLineItem, ShippingAddress } from "@/types/phase6-commerce";
import type { SellerCoupon } from "@/types/phase11-seller-growth";
import { getSellerCommerceSettings } from "@/services/businessConfigurationService";

interface ManualRequestRecord {
  customerId: string;
  addressId: string;
  items: readonly CartLineItem[];
  subtotalPaise: number;
  shippingPaise: number;
  discountPaise?: number;
  couponId?: string | null;
  couponCode?: string | null;
  couponStudioId?: string | null;
  totalPaise: number;
  paymentReference: string;
  status: string;
  acceptedPolicies?: Readonly<Record<string, string>>;
}

interface ProductCostingRecord {
  makingCostPaise?: number;
  sellerShippingCostPaise?: number;
  inventoryMode?: string;
}

function orderNumber(index: number): string {
  return `SDR-${Date.now().toString(36).toUpperCase()}-${String(index + 1).padStart(2, "0")}`;
}

function couponDiscountPaise(
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

export async function verifyManualMarketplacePayment(
  requestId: string,
  adminUid: string,
): Promise<readonly string[]> {
  const { db } = requireFirebaseServices();
  const requestRef = doc(db, "manualPaymentRequests", requestId);
  const requestSnapshot = await getDoc(requestRef);

  if (!requestSnapshot.exists()) throw new Error("Payment request not found.");
  const paymentRequest = requestSnapshot.data() as ManualRequestRecord;
  if (paymentRequest.status !== "pendingVerification") {
    throw new Error("This payment request has already been reviewed.");
  }
  if (!Array.isArray(paymentRequest.items) || paymentRequest.items.length === 0) {
    throw new Error("The payment request does not contain any products.");
  }

  const addressSnapshot = await getDoc(doc(db, "addressBooks", paymentRequest.customerId));
  const addresses = addressSnapshot.data()?.addresses;
  const address = Array.isArray(addresses)
    ? addresses.find((item) => item?.id === paymentRequest.addressId) as ShippingAddress | undefined
    : undefined;
  if (!address) throw new Error("Customer delivery address is missing.");

  const customerSnapshot = await getDoc(doc(db, "users", paymentRequest.customerId));
  if (!customerSnapshot.exists()) throw new Error("Customer profile is missing.");
  const customer = customerSnapshot.data();

  const [costEntries, commerceSettings] = await Promise.all([Promise.all(
    paymentRequest.items.map(async (item) => {
      const [costSnapshot, productSnapshot] = await Promise.all([
        getDoc(doc(db, "productCostings", item.productId)),
        getDoc(doc(db, "products", item.productId)),
      ]);
      return [item.productId, {
        ...(costSnapshot.exists() ? costSnapshot.data() : {}),
        inventoryMode: productSnapshot.data()?.inventoryMode,
      } as ProductCostingRecord] as const;
    }),
  ), getSellerCommerceSettings()]);
  const costByProduct = new Map(costEntries);
  const byStudio = new Map<string, CartLineItem[]>();
  for (const item of paymentRequest.items) {
    byStudio.set(item.studioId, [...(byStudio.get(item.studioId) ?? []), item]);
  }

  const calculatedSubtotalPaise = paymentRequest.items.reduce(
    (sum, item) => sum + item.unitPricePaise * item.quantity,
    0,
  );
  const calculatedShippingPaise = byStudio.size * 9900;
  if (
    paymentRequest.subtotalPaise !== calculatedSubtotalPaise ||
    paymentRequest.shippingPaise !== calculatedShippingPaise
  ) {
    throw new Error(
      "Payment totals do not match the submitted cart. Reject this request.",
    );
  }

  let verifiedDiscountPaise = 0;
  let couponRef: ReturnType<typeof doc> | null = null;
  if (paymentRequest.couponId) {
    couponRef = doc(
      db,
      "sellerCoupons",
      paymentRequest.couponId,
    );
    const couponSnapshot = await getDoc(couponRef);
    if (!couponSnapshot.exists()) {
      throw new Error(
        "The coupon attached to this payment no longer exists.",
      );
    }
    const coupon = {
      ...couponSnapshot.data(),
      couponId: couponSnapshot.id,
    } as SellerCoupon;
    if (
      coupon.code !== paymentRequest.couponCode ||
      coupon.studioId !== paymentRequest.couponStudioId
    ) {
      throw new Error(
        "Coupon details do not match the submitted payment.",
      );
    }
    const eligibleItems = byStudio.get(coupon.studioId) ?? [];
    const eligibleSubtotalPaise = eligibleItems.reduce(
      (sum, item) => sum + item.unitPricePaise * item.quantity,
      0,
    );
    if (
      eligibleSubtotalPaise < coupon.minimumOrderPaise ||
      eligibleSubtotalPaise <= 0
    ) {
      throw new Error(
        "This order does not satisfy the coupon minimum.",
      );
    }
    verifiedDiscountPaise = couponDiscountPaise(
      coupon,
      eligibleSubtotalPaise,
    );
  } else if (
    paymentRequest.couponCode ||
    paymentRequest.couponStudioId
  ) {
    throw new Error("Incomplete coupon details were submitted.");
  }

  if (
    Number(paymentRequest.discountPaise ?? 0) !==
      verifiedDiscountPaise ||
    paymentRequest.totalPaise !==
      calculatedSubtotalPaise +
        calculatedShippingPaise -
        verifiedDiscountPaise
  ) {
    throw new Error(
      "Payment discount or total is invalid. Reject this request.",
    );
  }

  const batch = writeBatch(db);
  const orderIds: string[] = [];
  let studioIndex = 0;

  for (const [studioId, items] of byStudio) {
    const orderRef = doc(collection(db, "orders"));
    const studioSnapshot = await getDoc(doc(db, "studios", studioId));
    const studio = studioSnapshot.data() ?? {};
    const subtotalPaise = items.reduce(
      (sum, item) => sum + item.unitPricePaise * item.quantity,
      0,
    );
    const shippingPaise = 9900;
    const discountPaise =
      studioId === paymentRequest.couponStudioId
        ? verifiedDiscountPaise
        : 0;
    const sellerCostPaise = items.reduce((sum, item) => {
      const cost = costByProduct.get(item.productId);
      return sum + Number(cost?.makingCostPaise ?? 0) * item.quantity;
    }, 0);
    const profitPaise = Math.max(
      0,
      subtotalPaise - discountPaise - sellerCostPaise,
    );
    const madeToOrder = items.some((item) => costByProduct.get(item.productId)?.inventoryMode === "madeToOrder");
    const materialAdvancePaise = !madeToOrder || commerceSettings.productionFundingMode === "none"
      ? 0
      : commerceSettings.productionFundingMode === "fullCost"
        ? sellerCostPaise
        : Math.round(sellerCostPaise * commerceSettings.materialAdvancePercent / 100);
    const makingAdvancePaise = !madeToOrder
      ? 0
      : Math.max(0, sellerCostPaise - materialAdvancePaise);
    const timeline = [{
      id: crypto.randomUUID(),
      status: "placed",
      label: "Payment verified and order confirmed",
      actorId: adminUid,
      actorRole: "admin",
      reason: null,
      createdAt: new Date().toISOString(),
      customerVisible: true,
    }];

    batch.set(orderRef, {
      orderId: orderRef.id,
      orderNumber: orderNumber(studioIndex),
      customerId: paymentRequest.customerId,
      customerName: String(customer.fullName ?? "Customer"),
      customerEmail: String(customer.email ?? ""),
      customerPhone: String(customer.phone ?? address.phone),
      studioId,
      studioName: items[0]?.studioName ?? String(studio.name ?? "Sidra Studio"),
      sellerUid: studio.ownerUid ?? null,
      lineItems: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.productName,
        qty: item.quantity,
        unitPrice: item.unitPricePaise,
        subtotal: item.unitPricePaise * item.quantity,
      })),
      orderStatus: "placed",
      paymentStatus: "paid",
      subtotalPaise,
      shippingPaise,
      discountPaise,
      couponCode:
        discountPaise > 0 ? paymentRequest.couponCode : null,
      totalPaise:
        subtotalPaise + shippingPaise - discountPaise,
      sellerCostPaise,
      sellerMakingCostPaise: sellerCostPaise,
      profitPaise,
      fundingMode: madeToOrder ? commerceSettings.productionFundingMode : "none",
      materialAdvancePaise,
      makingAdvancePaise,
      disputeWindowDays: commerceSettings.disputeWindowDays,
      subscriptionPlan: studio.subscriptionPlan ?? "free",
      commissionRateBasisPoints: Number(studio.commissionRateBasisPoints ?? 1200),
      manualPaymentRequestId: requestId,
      paymentReference: paymentRequest.paymentReference,
      acceptedPolicies: paymentRequest.acceptedPolicies ?? {},
      shippingAddress: address,
      shippingPackage: null,
      invoiceUrl: "",
      customOrderId: null,
      timeline,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const advanceRef = doc(db, "payouts", `material-${orderRef.id}`);
    if (materialAdvancePaise > 0) batch.set(advanceRef, {
      payoutId: advanceRef.id,
      orderId: orderRef.id,
      studioId,
      sellerUid: studio.ownerUid ?? null,
      type: "materialAdvance",
      grossPaise: materialAdvancePaise,
      commissionPaise: 0,
      sellerAmountPaise: materialAdvancePaise,
      status: "available",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (studio.ownerUid) {
      const notificationRef = doc(collection(db, "notifications"));
      batch.set(notificationRef, {
        recipientUid: studio.ownerUid,
        type: "newOrder",
        title: "New paid order received",
        body: `${items[0]?.studioName ?? "Your Studio"} received order ${orderRef.id.slice(0, 8)}.`,
        actionUrl: `/studio-admin/orders/${orderRef.id}`,
        read: false,
        studioId,
        orderId: orderRef.id,
        createdAt: serverTimestamp(),
      });
    }

    orderIds.push(orderRef.id);
    studioIndex += 1;
  }

  const paymentRef = doc(collection(db, "payments"));
  batch.set(paymentRef, {
    paymentId: paymentRef.id,
    orderIds,
    orderId: orderIds[0] ?? null,
    customerId: paymentRequest.customerId,
    gateway: "manualUpi",
    amount: paymentRequest.totalPaise,
    currency: "INR",
    status: "succeeded",
    gatewayTransactionId: paymentRequest.paymentReference,
    manualPaymentRequestId: requestId,
    verifiedBy: adminUid,
    createdAt: serverTimestamp(),
  });
  if (couponRef) {
    batch.update(couponRef, {
      usedCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  }
  batch.update(requestRef, {
    status: "verified",
    verifiedBy: adminUid,
    orderIds,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return orderIds;
}

export async function rejectManualMarketplacePayment(
  requestId: string,
  adminUid: string,
): Promise<void> {
  const { db } = requireFirebaseServices();
  const requestRef = doc(db, "manualPaymentRequests", requestId);
  const snapshot = await getDoc(requestRef);
  if (!snapshot.exists()) throw new Error("Payment request not found.");
  if (snapshot.data().status !== "pendingVerification") {
    throw new Error("This payment request has already been reviewed.");
  }
  const batch = writeBatch(db);
  batch.update(requestRef, {
    status: "rejected",
    verifiedBy: adminUid,
    updatedAt: serverTimestamp(),
  });
  const notificationRef = doc(collection(db, "notifications"));
  batch.set(notificationRef, {
    recipientUid: snapshot.data().customerId,
    type: "paymentRejected",
    title: "Payment verification needs attention",
    body: "Your payment reference could not be verified. Contact Sidra support or submit the correct UTR.",
    actionUrl: "/account/support",
    read: false,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

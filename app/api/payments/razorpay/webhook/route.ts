import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { sidraAdminDb } from "@/lib/server/firebaseAdmin";
import type {
  ServerCheckout,
  ServerCheckoutItem,
} from "@/lib/server/commerceCheckout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
function secureEqual(body: Buffer, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
function groups(
  items: ServerCheckoutItem[],
): Map<string, ServerCheckoutItem[]> {
  const result = new Map<string, ServerCheckoutItem[]>();
  items.forEach((item) =>
    result.set(item.studioId, [...(result.get(item.studioId) ?? []), item]),
  );
  return result;
}

export async function POST(request: Request): Promise<NextResponse> {
  const raw = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  if (!secureEqual(raw, signature, secret))
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  const event = JSON.parse(raw.toString("utf8")) as {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          method?: string;
          amount?: number;
        };
      };
    };
  };
  if (event.event !== "payment.captured")
    return NextResponse.json({ ok: true, ignored: true });
  const payment = event.payload?.payment?.entity;
  const paymentId = String(payment?.id ?? "");
  const gatewayOrderId = String(payment?.order_id ?? "");
  if (!paymentId || !gatewayOrderId)
    return NextResponse.json(
      { error: "Payment identifiers missing" },
      { status: 400 },
    );
  const db = sidraAdminDb();
  const query = await db
    .collection("paymentSessions")
    .where("gatewayOrderId", "==", gatewayOrderId)
    .limit(1)
    .get();
  if (query.empty)
    return NextResponse.json(
      { error: "Payment session not found" },
      { status: 404 },
    );
  const sessionRef = query.docs[0].ref;
  const session = query.docs[0].data();
  const checkout = session.checkout as ServerCheckout;
  if (
    !checkout ||
    !Array.isArray(checkout.items) ||
    Number(payment?.amount ?? checkout.totalPaise) !== checkout.totalPaise
  )
    return NextResponse.json(
      { error: "Verified amount mismatch" },
      { status: 409 },
    );
  const result = await db.runTransaction(async (transaction) => {
    const paymentRef = db.collection("payments").doc(paymentId);
    const existing = await transaction.get(paymentRef);
    if (existing.exists)
      return {
        duplicate: true,
        orderIds: (existing.data()?.orderIds ?? []) as string[],
      };
    const currentSession = await transaction.get(sessionRef);
    if (currentSession.data()?.status === "processed")
      return {
        duplicate: true,
        orderIds: (currentSession.data()?.orderIds ?? []) as string[],
      };
    const cartRef = db.collection("carts").doc(String(session.customerId));
    const cartSnapshot = await transaction.get(cartRef);
    const productEntries = await Promise.all(
      checkout.items.map(async (item) => {
        const ref = db.collection("products").doc(item.productId);
        return { item, ref, snapshot: await transaction.get(ref) };
      }),
    );
    for (const { item, ref, snapshot } of productEntries) {
      if (!snapshot.exists || snapshot.data()?.status !== "published")
        throw new Error("Paid product unavailable");
      if (snapshot.data()?.inventoryMode === "finite") {
        const current = Number(snapshot.data()?.inventoryCount ?? 0);
        if (current < item.quantity) throw new Error("Paid stock unavailable");
        transaction.update(ref, {
          inventoryCount: current - item.quantity,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    const year = new Date().getUTCFullYear();
    const counterRef = db.collection("counters").doc(`orders-${year}`);
    const counter = await transaction.get(counterRef);
    const first = Number(counter.data()?.value ?? 0) + 1;
    const grouped = groups(checkout.items);
    transaction.set(
      counterRef,
      {
        value: first + grouped.size - 1,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    const orderIds: string[] = [];
    let index = 0;
    for (const [studioId, items] of grouped) {
      const ref = db.collection("orders").doc();
      const orderNumber = `SDR-${year}-${String(first + index).padStart(6, "0")}`;
      const subtotal = items.reduce(
        (sum, item) => sum + item.unitPricePaise * item.quantity,
        0,
      );
      const shipping = checkout.shippingPaise > 0 ? 9900 : 0;
      const discount =
        studioId === checkout.couponStudioId ? checkout.discountPaise : 0;
      const sellerCostPaise = items.reduce(
        (sum, item) => sum + item.makingCostPaise * item.quantity,
        0,
      );
      const profitPaise = Math.max(0, subtotal - discount - sellerCostPaise);
      const commissionRateBasisPoints =
        items[0]?.commissionRateBasisPoints ?? 1200;
      const commissionPaise = Math.round(
        (profitPaise * commissionRateBasisPoints) / 10000,
      );
      const sellerEarningPaise = Math.max(
        0,
        sellerCostPaise + profitPaise - commissionPaise,
      );
      transaction.create(ref, {
        orderId: ref.id,
        orderNumber,
        customerId: session.customerId,
        customerName: checkout.customer.name,
        customerEmail: checkout.customer.email,
        customerPhone: checkout.customer.phone,
        studioId,
        studioIds: [studioId],
        studioName: items[0]?.studioName ?? "Sidra Studio",
        sellerUid: items[0]?.sellerUid ?? null,
        lineItems: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.productName,
          qty: item.quantity,
          unitPrice: item.unitPricePaise,
          subtotal: item.unitPricePaise * item.quantity,
        })),
        items,
        orderStatus: "placed",
        status: "placed",
        paymentStatus: "paid",
        subtotalPaise: subtotal,
        shippingPaise: shipping,
        discountPaise: discount,
        totalPaise: subtotal + shipping - discount,
        sellerCostPaise,
        profitPaise,
        commissionRateBasisPoints,
        commissionPaise,
        sellerEarningPaise,
        shippingAddress: checkout.shippingAddress,
        shippingPackage: null,
        invoiceUrl: "",
        customOrderId: null,
        paymentGateway: "razorpay",
        paymentReference: paymentId,
        timeline: [
          {
            id: crypto.randomUUID(),
            status: "placed",
            label: "Payment confirmed and order placed",
            actorId: "vercel-razorpay-webhook",
            actorRole: "system",
            reason: null,
            createdAt: new Date().toISOString(),
            customerVisible: true,
          },
        ],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (items[0]?.sellerUid)
        transaction.create(db.collection("notifications").doc(), {
          recipientUid: items[0].sellerUid,
          type: "newOrder",
          title: "New paid order received",
          body: `Order ${orderNumber} is ready for acceptance.`,
          actionUrl: `/studio-admin/orders/${ref.id}`,
          read: false,
          studioId,
          orderId: ref.id,
          createdAt: FieldValue.serverTimestamp(),
        });
      orderIds.push(ref.id);
      index += 1;
    }
    const purchased = new Set(
      checkout.items.map(
        (item) => `${item.productId}:${item.variantId ?? "default"}`,
      ),
    );
    const storedItems = Array.isArray(cartSnapshot.data()?.items)
      ? cartSnapshot.data()?.items
      : [];
    transaction.set(
      cartRef,
      {
        items: storedItems.filter((item: unknown) => {
          const value =
            item && typeof item === "object"
              ? (item as Record<string, unknown>)
              : {};
          return !purchased.has(
            `${String(value.productId ?? "")}:${value.variantId ? String(value.variantId) : "default"}`,
          );
        }),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    if (checkout.couponId)
      transaction.set(
        db.collection("sellerCoupons").doc(checkout.couponId),
        {
          usedCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    transaction.create(db.collection("notifications").doc(), {
      recipientUid: session.customerId,
      type: "paymentConfirmed",
      title: "Payment confirmed",
      body: `${orderIds.length} order${orderIds.length === 1 ? "" : "s"} placed successfully.`,
      actionUrl: orderIds[0]
        ? `/account/orders/${orderIds[0]}`
        : "/account/orders",
      read: false,
      orderId: orderIds[0] ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.create(paymentRef, {
      gateway: "razorpay",
      gatewayPaymentId: paymentId,
      gatewayOrderId,
      orderId: orderIds[0] ?? null,
      orderIds,
      customerId: session.customerId,
      amountPaise: checkout.totalPaise,
      currency: "INR",
      method: payment?.method ?? "unknown",
      status: "captured",
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.update(sessionRef, {
      status: "processed",
      orderId: orderIds[0] ?? null,
      orderIds,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { duplicate: false, orderIds };
  });
  return NextResponse.json({
    ok: true,
    ...result,
    orderId: result.orderIds[0] ?? null,
  });
}

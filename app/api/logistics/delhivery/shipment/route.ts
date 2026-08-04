import { NextResponse } from "next/server";
import { calculateDelhiveryRate, createDelhiveryPickup, createDelhiveryShipment, ensureDelhiveryWarehouse } from "@/lib/server/delhivery";
import { requireServerIdentity, sidraAdminDb } from "@/lib/server/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function positive(value: unknown): number {
  const parsed = Math.round(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const identity = await requireServerIdentity(request);
    const db = sidraAdminDb();
    const input = await request.json() as Record<string, unknown>;
    const orderId = text(input.orderId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 180);
    if (!orderId) return NextResponse.json({ error: "Order is required." }, { status: 400 });
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnapshot = await orderRef.get();
    const order = orderSnapshot.data();
    if (!orderSnapshot.exists || !order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (text(order.sellerUid) !== identity.uid || identity.role !== "seller") {
      return NextResponse.json({ error: "Only this order's Studio can prepare shipment." }, { status: 403 });
    }
    if (text(order.paymentStatus) !== "paid") {
      return NextResponse.json({ error: "Shipment can start only after verified payment." }, { status: 409 });
    }

    const existing = order.shippingPackage as Record<string, unknown> | null;
    const existingAwb = text(existing?.trackingNumber || existing?.awb);
    if (existingAwb) {
      return NextResponse.json({
        awb: existingAwb,
        pickupRequestId: text(existing?.pickupRequestId) || null,
        existing: true,
      });
    }

    const studioId = text(order.studioId);
    const [studioSnapshot, verificationSnapshot, logisticsSnapshot, kycSnapshot] = await Promise.all([
      studioId ? db.collection("studios").doc(studioId).get() : null,
      studioId ? db.collection("sellerVerifications").doc(studioId).get() : null,
      db.collection("settings").doc("logistics").get(),
      db.collection("settings").doc("sellerKyc").get(),
    ]);
    const studio = studioSnapshot?.data() ?? null;
    const verification = verificationSnapshot?.data() ?? null;
    const logistics = logisticsSnapshot.data() ?? null;
    const kycSettings = kycSnapshot.data() ?? null;
    if (kycSettings?.enabled !== false && verification?.status !== "verified") {
      return NextResponse.json({ error: "Studio KYC and pickup address must be verified before shipping." }, { status: 409 });
    }
    const address = (order.shippingAddress ?? {}) as Record<string, unknown>;
    const packageInput = (input.package ?? {}) as Record<string, unknown>;
    const pickup = (verification?.pickupAddress ?? studio?.pickupAddress ?? {}) as Record<string, unknown>;
    const hasVerifiedPickup = verification?.status === "verified"
      && text(pickup.postalCode).length === 6;
    const configuredPickupLocation = text(studio?.delhiveryPickupLocation)
      || (hasVerifiedPickup ? "" : text(logistics?.defaultPickupLocation))
      || (hasVerifiedPickup ? "" : process.env.DELHIVERY_PICKUP_LOCATION?.trim())
      || "";
    const pickupLocation = configuredPickupLocation || `SIDRA-${studioId}`.slice(0, 48);
    if (!pickupLocation) {
      return NextResponse.json({
        error: "Pickup location is not configured. Complete Studio verification or set DELHIVERY_PICKUP_LOCATION.",
      }, { status: 409 });
    }

    const weightGrams = positive(packageInput.weightGrams);
    const lengthCm = positive(packageInput.lengthCm);
    const widthCm = positive(packageInput.widthCm);
    const heightCm = positive(packageInput.heightCm);
    if (!weightGrams || !lengthCm || !widthCm || !heightCm) {
      return NextResponse.json({ error: "Complete package weight and dimensions." }, { status: 400 });
    }
    if (!configuredPickupLocation) {
      await ensureDelhiveryWarehouse({
        name: pickupLocation,
        legalName: text(verification?.legalName) || text(pickup.name),
        phone: text(pickup.phone),
        email: text(pickup.email),
        address: [text(pickup.line1), text(pickup.line2)].filter(Boolean).join(", "),
        city: text(pickup.city),
        state: text(pickup.state),
        pin: text(pickup.postalCode),
      });
    }
    const lineItems = Array.isArray(order.lineItems) ? order.lineItems as Array<Record<string, unknown>> : [];
    const shipment = await createDelhiveryShipment({
      orderId,
      orderNumber: text(order.orderNumber) || orderId,
      consignee: {
        name: text(order.customerName) || text(address.name),
        phone: text(order.customerPhone) || text(address.phone),
        address: [text(address.line1), text(address.line2)].filter(Boolean).join(", "),
        city: text(address.city),
        state: text(address.state),
        pin: text(address.postalCode || address.pin),
      },
      pickupLocation,
      weightGrams,
      lengthCm,
      widthCm,
      heightCm,
      declaredValuePaise: positive(order.totalPaise || order.total),
      productDescription: lineItems.map((item) => text(item.name)).filter(Boolean).join(", ").slice(0, 500) || "Sidra order",
    });
    let shippingChargePaise: number | null = null;
    try {
      shippingChargePaise = (await calculateDelhiveryRate({
        originPin: text(pickup.postalCode),
        destinationPin: text(address.postalCode || address.pin),
        weightGrams,
      })).chargePaise;
    } catch {
      shippingChargePaise = null;
    }
    let pickupRequestId: string | null = null;
    let pickupWarning: string | null = null;
    try {
      pickupRequestId = (await createDelhiveryPickup({ pickupLocation, packageCount: 1 })).pickupRequestId;
    } catch (caught) {
      pickupWarning = caught instanceof Error ? caught.message : "Pickup request must be scheduled manually.";
    }
    const costAllocation = text(logistics?.shippingCostAllocation) || "includedInPrice";
    const shippingPackage = {
      weightGrams, lengthCm, widthCm, heightCm, courierName: "Delhivery",
      trackingNumber: shipment.awb, estimatedDeliveryDate: "", dispatchedAt: null,
      provider: "delhivery", awb: shipment.awb, pickupRequestId, pickupLocation,
      labelAvailable: true, status: pickupRequestId ? "Ready for pickup" : "Ready to ship",
      statusType: "readyToShip", lastLocation: null, events: [], shippingChargePaise,
      costAllocation,
    };
    const batch = db.batch();
    batch.update(orderRef, {
      orderStatus: "readyToShip",
      shippingPackage,
      timeline: FieldValue.arrayUnion({
        id: crypto.randomUUID(), status: "readyToShip", label: "Delhivery shipment created · label ready",
        actorId: identity.uid, actorRole: "seller", reason: pickupWarning, createdAt: new Date().toISOString(), customerVisible: true,
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.set(db.collection("shippingLedgers").doc(orderId), {
      orderId, studioId, provider: "delhivery", awb: shipment.awb,
      actualChargePaise: shippingChargePaise, allocation: costAllocation,
      sellerOutOfPocketPaise: 0, status: shippingChargePaise == null ? "awaitingProviderInvoice" : "estimated",
      updatedAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    if (order.customerId) batch.create(db.collection("notifications").doc(), {
      recipientUid: order.customerId, type: "orderStatusUpdated", title: `Order ${text(order.orderNumber) || orderId} is ready to ship`,
      body: `Delhivery AWB ${shipment.awb} has been created.`, actionUrl: `/account/orders/${orderId}`,
      read: false, orderId, createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return NextResponse.json({
      awb: shipment.awb,
      pickupRequestId,
      pickupLocation,
      pickupWarning,
      shippingChargePaise,
      costAllocation,
      shippingPackage,
      existing: false,
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Shipment could not be created.";
    const status = message.includes("AUTH") || message.includes("SESSION") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import { calculateDelhiveryRate, createDelhiveryPickup, createDelhiveryShipment, ensureDelhiveryWarehouse } from "@/lib/server/delhivery";
import { firebaseBearerToken, verifyFirebaseRequest } from "@/lib/server/firebaseIdentity";
import { getFirestoreDocumentWithUserToken } from "@/lib/server/firestoreRest";

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
    const identity = await verifyFirebaseRequest(request);
    const token = firebaseBearerToken(request);
    const input = await request.json() as Record<string, unknown>;
    const orderId = text(input.orderId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 180);
    if (!orderId) return NextResponse.json({ error: "Order is required." }, { status: 400 });
    const order = await getFirestoreDocumentWithUserToken(token, `orders/${orderId}`);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (text(order.sellerUid) !== identity.uid) {
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
    const studio = studioId
      ? await getFirestoreDocumentWithUserToken(token, `studios/${encodeURIComponent(studioId)}`)
      : null;
    const verification = studioId
      ? await getFirestoreDocumentWithUserToken(token, `sellerVerifications/${encodeURIComponent(studioId)}`)
      : null;
    const logistics = await getFirestoreDocumentWithUserToken(token, "settings/logistics");
    const kycSettings = await getFirestoreDocumentWithUserToken(token, "settings/sellerKyc");
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
    return NextResponse.json({
      awb: shipment.awb,
      pickupRequestId,
      pickupLocation,
      pickupWarning,
      shippingChargePaise,
      costAllocation: text(logistics?.shippingCostAllocation) || "buyerPaid",
      existing: false,
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Shipment could not be created.";
    const status = message.includes("AUTH") || message.includes("SESSION") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { NextResponse } from "next/server";
import { trackDelhiveryShipment } from "@/lib/server/delhivery";
import { firebaseBearerToken, verifyFirebaseRequest } from "@/lib/server/firebaseIdentity";
import { getFirestoreDocumentWithUserToken } from "@/lib/server/firestoreRest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await verifyFirebaseRequest(request);
    const token = firebaseBearerToken(request);
    const orderId = new URL(request.url).searchParams.get("orderId")?.replace(/[^a-zA-Z0-9_-]/g, "") ?? "";
    if (!orderId) return NextResponse.json({ error: "Order is required." }, { status: 400 });
    const order = await getFirestoreDocumentWithUserToken(token, `orders/${orderId}`);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    const shipment = (order.shippingPackage ?? {}) as Record<string, unknown>;
    const awb = String(shipment.trackingNumber ?? shipment.awb ?? "").trim();
    if (!awb) return NextResponse.json({ error: "Tracking starts after shipment creation." }, { status: 409 });
    return NextResponse.json({ awb, ...(await trackDelhiveryShipment(awb)) });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Tracking is temporarily unavailable.";
    return NextResponse.json({ error: message }, { status: message.includes("AUTH") ? 401 : 500 });
  }
}

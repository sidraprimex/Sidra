import { NextResponse } from "next/server";
import { findLabelUrl, getDelhiveryLabel } from "@/lib/server/delhivery";
import { firebaseBearerToken, verifyFirebaseRequest } from "@/lib/server/firebaseIdentity";
import { getFirestoreDocumentWithUserToken } from "@/lib/server/firestoreRest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[char] ?? char);
}

export async function GET(request: Request): Promise<Response> {
  try {
    await verifyFirebaseRequest(request);
    const token = firebaseBearerToken(request);
    const orderId = new URL(request.url).searchParams.get("orderId")?.replace(/[^a-zA-Z0-9_-]/g, "") ?? "";
    const order = orderId
      ? await getFirestoreDocumentWithUserToken(token, `orders/${orderId}`)
      : null;
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    const shipment = (order.shippingPackage ?? {}) as Record<string, unknown>;
    const awb = String(shipment.trackingNumber ?? shipment.awb ?? "").trim();
    if (!awb) return NextResponse.json({ error: "Shipping label is not ready." }, { status: 409 });
    const payload = await getDelhiveryLabel(awb);
    const labelUrl = findLabelUrl(payload);
    if (labelUrl) return NextResponse.redirect(labelUrl);
    const safePayload = escapeHtml(JSON.stringify(payload, null, 2));
    return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>Sidra label ${escapeHtml(awb)}</title><style>body{font:14px Arial;padding:24px;color:#111}.sheet{max-width:760px;margin:auto;border:2px solid #111;padding:24px}h1{font-size:24px}.awb{font-size:28px;font-weight:700;letter-spacing:.08em}pre{white-space:pre-wrap;font-size:11px}@media print{button{display:none}.sheet{border:0}}</style></head><body><div class="sheet"><h1>SIDRA · DELHIVERY SHIPPING LABEL</h1><p>AWB / Tracking number</p><p class="awb">${escapeHtml(awb)}</p><p>Order: ${escapeHtml(String(order.orderNumber ?? orderId))}</p><pre>${safePayload}</pre><button onclick="window.print()">Print / Save as PDF</button></div><script>window.addEventListener("load",()=>setTimeout(()=>window.print(),400))</script></body></html>`, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": `inline; filename="sidra-${awb}-label.html"`,
      },
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Label is unavailable.";
    return NextResponse.json({ error: message }, { status: message.includes("AUTH") ? 401 : 500 });
  }
}

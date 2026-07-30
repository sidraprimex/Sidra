import { arrayUnion, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type { ShipmentEvent } from "@/types/logistics";
import type { FulfilmentOrder, ShippingPackage } from "@/types/phase7-orders";

async function authHeaders(): Promise<Record<string, string>> {
  const { auth } = requireFirebaseServices();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in again to continue.");
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
}

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  const payload = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(String(payload.error ?? "Delhivery request failed."));
  return payload;
}

export async function prepareDelhiveryShipment(params: {
  order: FulfilmentOrder;
  package: Pick<ShippingPackage, "weightGrams" | "lengthCm" | "widthCm" | "heightCm">;
}): Promise<ShippingPackage> {
  const headers = await authHeaders();
  const response = await fetch("/api/logistics/delhivery/shipment", {
    method: "POST",
    headers,
    body: JSON.stringify({ orderId: params.order.orderId, package: params.package }),
  });
  const payload = await responseJson(response);
  const awb = String(payload.awb ?? "");
  const value: ShippingPackage = {
    ...params.package,
    courierName: "Delhivery",
    trackingNumber: awb,
    estimatedDeliveryDate: "",
    dispatchedAt: null,
    provider: "delhivery",
    awb,
    pickupRequestId: typeof payload.pickupRequestId === "string" ? payload.pickupRequestId : null,
    pickupLocation: String(payload.pickupLocation ?? ""),
    labelAvailable: true,
    status: payload.pickupRequestId ? "Ready for pickup" : "Ready to ship",
    statusType: "readyToShip",
    lastLocation: null,
    events: [],
    shippingChargePaise: typeof payload.shippingChargePaise === "number" ? payload.shippingChargePaise : null,
    costAllocation: String(payload.costAllocation ?? "buyerPaid") as import("@/types/logistics").ShippingCostAllocation,
  };
  const { db, auth } = requireFirebaseServices();
  await updateDoc(doc(db, "orders", params.order.orderId), {
    orderStatus: "readyToShip",
    shippingPackage: value,
    timeline: arrayUnion({
      id: crypto.randomUUID(),
      status: "readyToShip",
      label: "Delhivery shipment created · label ready",
      actorId: auth.currentUser?.uid ?? "",
      actorRole: "seller",
      reason: typeof payload.pickupWarning === "string" ? payload.pickupWarning : null,
      createdAt: new Date().toISOString(),
      customerVisible: true,
    }),
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(db, "shippingLedgers", params.order.orderId), {
    orderId: params.order.orderId,
    studioId: params.order.studioId,
    provider: "delhivery",
    awb,
    actualChargePaise: value.shippingChargePaise,
    allocation: value.costAllocation,
    sellerOutOfPocketPaise: 0,
    status: value.shippingChargePaise == null ? "awaitingProviderInvoice" : "estimated",
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });
  return value;
}

export async function refreshDelhiveryTracking(orderId: string): Promise<{
  awb: string;
  status: string;
  statusType: string;
  expectedDeliveryDate: string | null;
  lastLocation: string | null;
  events: readonly ShipmentEvent[];
}> {
  const headers = await authHeaders();
  const response = await fetch(`/api/logistics/delhivery/track?orderId=${encodeURIComponent(orderId)}`, {
    headers,
    cache: "no-store",
  });
  const payload = await responseJson(response);
  return {
    awb: String(payload.awb ?? ""),
    status: String(payload.status ?? "Tracking"),
    statusType: String(payload.statusType ?? ""),
    expectedDeliveryDate: typeof payload.expectedDeliveryDate === "string" ? payload.expectedDeliveryDate : null,
    lastLocation: typeof payload.lastLocation === "string" ? payload.lastLocation : null,
    events: Array.isArray(payload.events) ? payload.events as ShipmentEvent[] : [],
  };
}

export async function openDelhiveryLabel(orderId: string): Promise<void> {
  const { auth } = requireFirebaseServices();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in again to download the label.");
  const response = await fetch(`/api/logistics/delhivery/label?orderId=${encodeURIComponent(orderId)}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = await response.json() as { error?: string };
    throw new Error(payload.error ?? "Label is unavailable.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sidra-${orderId}-shipping-label.html`;
    anchor.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

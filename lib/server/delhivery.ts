import type { ShipmentEvent } from "@/types/logistics";

const DEFAULT_BASE_URL = "https://track.delhivery.com";

function token(): string {
  const value = process.env.DELHIVERY_API_TOKEN?.trim();
  if (!value) throw new Error("DELHIVERY_API_TOKEN_MISSING");
  return value;
}

function baseUrl(): string {
  return (process.env.DELHIVERY_API_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");
}

async function delhiveryFetch(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      authorization: `Token ${token()}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  return response;
}

async function jsonOrText(response: Response): Promise<unknown> {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function string(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export interface DelhiveryShipmentInput {
  orderId: string;
  orderNumber: string;
  consignee: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pin: string;
  };
  pickupLocation: string;
  weightGrams: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  declaredValuePaise: number;
  productDescription: string;
}

export async function ensureDelhiveryWarehouse(input: {
  name: string;
  legalName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pin: string;
}): Promise<void> {
  const response = await delhiveryFetch(
    process.env.DELHIVERY_WAREHOUSE_PATH?.trim() || "/api/backend/clientwarehouse/create/",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        phone: input.phone,
        city: input.city,
        name: input.name,
        pin: input.pin,
        address: input.address,
        country: "India",
        email: input.email,
        registered_name: input.legalName,
        return_address: input.address,
        return_pin: input.pin,
        return_city: input.city,
        return_state: input.state,
        return_country: "India",
      }),
    },
  );
  if (response.ok) return;
  const payload = await jsonOrText(response);
  const message = JSON.stringify(payload).toLowerCase();
  if (response.status === 409 || message.includes("already") || message.includes("exist")) return;
  throw new Error(`DELHIVERY_WAREHOUSE_FAILED_${response.status}: ${JSON.stringify(payload)}`);
}

export async function createDelhiveryShipment(input: DelhiveryShipmentInput): Promise<{
  awb: string;
  raw: unknown;
}> {
  const shipment = {
    name: input.consignee.name,
    add: input.consignee.address,
    pin: input.consignee.pin,
    city: input.consignee.city,
    state: input.consignee.state,
    country: "India",
    phone: input.consignee.phone,
    order: input.orderNumber || input.orderId,
    payment_mode: "Prepaid",
    return_pin: "",
    return_city: "",
    return_phone: "",
    return_add: "",
    return_state: "",
    return_country: "India",
    products_desc: input.productDescription,
    hsn_code: "",
    cod_amount: "0",
    order_date: new Date().toISOString().slice(0, 10),
    total_amount: (input.declaredValuePaise / 100).toFixed(2),
    seller_add: "",
    seller_name: "Sidra",
    seller_inv: input.orderNumber || input.orderId,
    quantity: "1",
    waybill: "",
    shipment_width: String(input.widthCm),
    shipment_height: String(input.heightCm),
    weight: String(input.weightGrams),
    shipping_mode: "Surface",
    address_type: "home",
  };
  const body = new URLSearchParams({
    format: "json",
    data: JSON.stringify({
      shipments: [shipment],
      pickup_location: { name: input.pickupLocation },
    }),
  });
  const response = await delhiveryFetch(
    process.env.DELHIVERY_CREATE_SHIPMENT_PATH?.trim() || "/api/cmu/create.json",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    },
  );
  const payload = await jsonOrText(response);
  if (!response.ok) throw new Error(`DELHIVERY_CREATE_FAILED_${response.status}: ${JSON.stringify(payload)}`);
  const top = record(payload);
  const packages = Array.isArray(top.packages) ? top.packages : [];
  const first = record(packages[0]);
  const awb = string(first.waybill || first.wbn || top.waybill || top.awb);
  if (!awb) throw new Error(`DELHIVERY_AWB_MISSING: ${JSON.stringify(payload)}`);
  return { awb, raw: payload };
}

export async function createDelhiveryPickup(params: {
  pickupLocation: string;
  packageCount: number;
}): Promise<{ pickupRequestId: string | null; raw: unknown }> {
  const pickupDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const response = await delhiveryFetch(
    process.env.DELHIVERY_PICKUP_REQUEST_PATH?.trim() || "/fm/request/new/",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        pickup_time: "14:00:00",
        pickup_date: pickupDate,
        pickup_location: params.pickupLocation,
        expected_package_count: params.packageCount,
      }),
    },
  );
  const payload = await jsonOrText(response);
  if (!response.ok) throw new Error(`DELHIVERY_PICKUP_FAILED_${response.status}: ${JSON.stringify(payload)}`);
  const value = record(payload);
  return {
    pickupRequestId: string(value.pickup_id || value.pickupRequestId || value.pr_number) || null,
    raw: payload,
  };
}

export async function trackDelhiveryShipment(awb: string): Promise<{
  status: string;
  statusType: string;
  expectedDeliveryDate: string | null;
  lastLocation: string | null;
  events: readonly ShipmentEvent[];
  raw: unknown;
}> {
  const response = await delhiveryFetch(`/api/v1/packages/json/?waybill=${encodeURIComponent(awb)}`);
  const payload = await jsonOrText(response);
  if (!response.ok) throw new Error(`DELHIVERY_TRACK_FAILED_${response.status}`);
  const top = record(payload);
  const shipmentData = record((Array.isArray(top.ShipmentData) ? top.ShipmentData[0] : null));
  const shipment = record(shipmentData.Shipment);
  const current = record(shipment.Status);
  const scans = Array.isArray(shipment.Scans) ? shipment.Scans : [];
  const events = scans.map((item): ShipmentEvent => {
    const scan = record(record(item).ScanDetail);
    return {
      code: string(scan.ScanCode),
      status: string(scan.Scan),
      statusType: string(scan.StatusCode),
      location: string(scan.ScannedLocation),
      instructions: string(scan.Instructions),
      occurredAt: string(scan.ScanDateTime),
    };
  });
  return {
    status: string(current.Status) || "Shipment created",
    statusType: string(current.StatusType),
    expectedDeliveryDate: string(shipment.ExpectedDeliveryDate) || null,
    lastLocation: string(current.StatusLocation) || events[0]?.location || null,
    events,
    raw: payload,
  };
}

export async function getDelhiveryLabel(awb: string): Promise<unknown> {
  const response = await delhiveryFetch(`/api/p/packing_slip?wbns=${encodeURIComponent(awb)}`);
  const payload = await jsonOrText(response);
  if (!response.ok) throw new Error(`DELHIVERY_LABEL_FAILED_${response.status}`);
  return payload;
}

export async function calculateDelhiveryRate(params: {
  originPin: string;
  destinationPin: string;
  weightGrams: number;
}): Promise<{ chargePaise: number | null; raw: unknown }> {
  const query = new URLSearchParams({
    md: "S",
    cgm: String(params.weightGrams),
    o_pin: params.originPin,
    d_pin: params.destinationPin,
    ss: "Delivered",
  });
  const response = await delhiveryFetch(`/api/kinko/v1/invoice/charges/.json?${query.toString()}`);
  const payload = await jsonOrText(response);
  if (!response.ok) throw new Error(`DELHIVERY_RATE_FAILED_${response.status}`);
  const first = Array.isArray(payload) ? record(payload[0]) : record(payload);
  const amount = Number(first.total_amount ?? first.totalAmount ?? first.charge ?? first.amount);
  return {
    chargePaise: Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null,
    raw: payload,
  };
}

export function findLabelUrl(payload: unknown): string | null {
  const queue: unknown[] = [payload];
  const keys = new Set(["pdf_download_link", "pdfDownloadLink", "label_url", "labelUrl", "download_url"]);
  while (queue.length) {
    const current = queue.shift();
    if (Array.isArray(current)) queue.push(...current);
    else if (current && typeof current === "object") {
      for (const [key, value] of Object.entries(current as Record<string, unknown>)) {
        if (keys.has(key) && typeof value === "string" && /^https?:\/\//.test(value)) return value;
        queue.push(value);
      }
    }
  }
  return null;
}

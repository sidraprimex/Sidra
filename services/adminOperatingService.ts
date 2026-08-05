import { callVercelBackend } from "@/services/vercelBackendService";
import type {
  AdminRecord,
  AdminSnapshot,
  SidraIntegrationSettings,
  SidraPaymentSettings,
  SidraThemeSettings,
} from "@/types/admin-os";

function normalize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    if ("toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
      return (value as { toDate: () => Date }).toDate().toISOString();
    }
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalize(item)]),
    );
  }
  return value;
}

export function toEditableRecord(value: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return normalize(value) as Record<string, unknown>;
}

export async function listAdminCollection(
  collectionName: string,
  maxResults = 250,
): Promise<readonly AdminRecord[]> {
  return callVercelBackend("listAdminCollection", { collectionName, maxResults });
}

export function loadAdminSnapshot(maxResults = 250): Promise<AdminSnapshot> {
  return callVercelBackend("loadAdminSnapshot", { maxResults });
}

export async function updateAdminDocument(input: {
  collectionName: string;
  documentId: string;
  patch: Readonly<Record<string, unknown>>;
  actorUid: string;
  action: string;
  summary: string;
}): Promise<void> {
  await callVercelBackend("updateAdminDocument", {
    collectionName: input.collectionName,
    documentId: input.documentId,
    patch: input.patch,
    action: input.action,
    summary: input.summary,
  });
}

export async function setAdminDocument(input: {
  collectionName: string;
  documentId: string;
  value: Readonly<Record<string, unknown>>;
  actorUid: string;
  action?: string;
  summary?: string;
  merge?: boolean;
}): Promise<void> {
  await callVercelBackend("setAdminDocument", {
    collectionName: input.collectionName,
    documentId: input.documentId,
    value: input.value,
    action: input.action,
    summary: input.summary,
    merge: input.merge,
  });
}

export async function deleteAdminDocument(input: {
  collectionName: string;
  documentId: string;
  actorUid: string;
}): Promise<void> {
  await callVercelBackend("deleteAdminDocument", {
    collectionName: input.collectionName,
    documentId: input.documentId,
    action: "document.delete",
    summary: `Deleted ${input.collectionName}/${input.documentId}`,
  });
}

export function getAdminDocument(
  collectionName: string,
  documentId: string,
): Promise<AdminRecord | null> {
  return callVercelBackend("getAdminDocument", { collectionName, documentId });
}

export function saveThemeSettings(
  value: Omit<SidraThemeSettings, "updatedAt">,
): Promise<void> {
  return setAdminDocument({
    collectionName: "settings",
    documentId: "theme",
    value,
    actorUid: value.updatedBy,
    action: "theme.publish",
    summary: "Published Sidra global theme",
  });
}

export function savePaymentSettings(
  value: Omit<SidraPaymentSettings, "updatedAt">,
): Promise<void> {
  return setAdminDocument({
    collectionName: "settings",
    documentId: "payments",
    value,
    actorUid: value.updatedBy,
    action: "payments.configure",
    summary: `Changed payment mode to ${value.mode}`,
  });
}

export function saveIntegrationSettings(
  value: Omit<SidraIntegrationSettings, "updatedAt">,
): Promise<void> {
  return setAdminDocument({
    collectionName: "settings",
    documentId: "integrations",
    value,
    actorUid: value.updatedBy,
    action: "integrations.configure",
    summary: "Updated public integration status and provider settings",
  });
}

export async function markOrderDeliveredAndSettle(input: {
  orderId: string;
  actorUid: string;
}): Promise<void> {
  await callVercelBackend("markOrderDeliveredAndSettle", { orderId: input.orderId });
}

import { callVercelBackend } from "@/services/vercelBackendService";

export async function verifyManualMarketplacePayment(
  requestId: string,
  _adminUid: string,
): Promise<readonly string[]> {
  const result = await callVercelBackend<
    { requestId: string },
    { orderIds: readonly string[] }
  >("verifyManualMarketplacePayment", { requestId });
  return result.orderIds;
}

export async function rejectManualMarketplacePayment(
  requestId: string,
  _adminUid: string,
): Promise<void> {
  await callVercelBackend<
    { requestId: string },
    { accepted: true }
  >("rejectManualMarketplacePayment", { requestId });
}

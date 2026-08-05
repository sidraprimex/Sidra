import { callVercelBackend } from "@/services/vercelBackendService";

export async function verifyManualMarketplacePayment(
  requestId: string,
  adminUid?: string,
): Promise<readonly string[]> {
  void adminUid;
  const result = await callVercelBackend<
    { requestId: string },
    { orderIds: readonly string[] }
  >("verifyManualMarketplacePayment", { requestId });
  return result.orderIds;
}

export async function rejectManualMarketplacePayment(
  requestId: string,
  adminUid?: string,
): Promise<void> {
  void adminUid;
  await callVercelBackend<
    { requestId: string },
    { accepted: true }
  >("rejectManualMarketplacePayment", { requestId });
}

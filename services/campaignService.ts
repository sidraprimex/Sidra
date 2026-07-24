import { orderBy, where } from "firebase/firestore";
import { getDocumentById, listDocuments, setDocument, updateDocument } from "@/services/firestoreRepository";
import type { Campaign } from "@/types/marketing";

export function getCampaign(campaignId: string): Promise<Campaign | null> {
  return getDocumentById<Campaign>("campaigns", campaignId);
}

export function listActiveCampaigns(maxResults = 20): Promise<readonly Campaign[]> {
  return listDocuments<Campaign>("campaigns", [where("status", "==", "active"), orderBy("startsAt", "desc")], maxResults);
}

export function saveCampaign(campaign: Campaign): Promise<void> {
  return setDocument("campaigns", campaign.campaignId, campaign);
}

export function updateCampaign(campaignId: string, value: Partial<Campaign>): Promise<void> {
  return updateDocument<Campaign>("campaigns", campaignId, value);
}

import { orderBy, serverTimestamp } from "firebase/firestore";
import { getDocumentById, listDocuments, setDocument, updateDocument } from "@/services/firestoreRepository";
import type { CorporateLead, CorporateLeadStatus } from "@/types/platform";

export function getCorporateLead(leadId: string): Promise<CorporateLead | null> {
  return getDocumentById<CorporateLead>("corporateLeads", leadId);
}

export function listCorporateLeads(maxResults = 100): Promise<readonly CorporateLead[]> {
  return listDocuments<CorporateLead>("corporateLeads", [orderBy("createdAt", "desc")], maxResults);
}

export function createCorporateLead(lead: Omit<CorporateLead, "createdAt" | "updatedAt">): Promise<void> {
  return setDocument("corporateLeads", lead.leadId, { ...lead, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export function updateCorporateLeadStatus(leadId: string, status: CorporateLeadStatus): Promise<void> {
  return updateDocument<CorporateLead>("corporateLeads", leadId, { status, updatedAt: serverTimestamp() });
}

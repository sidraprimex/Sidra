import { orderBy, serverTimestamp, where } from "firebase/firestore";
import { getDocumentById, listDocuments, setDocument, updateDocument } from "@/services/firestoreRepository";
import type { SupportTicket, SupportTicketStatus } from "@/types/communication";

export function getSupportTicket(ticketId: string): Promise<SupportTicket | null> {
  return getDocumentById<SupportTicket>("supportTickets", ticketId);
}

export function listCustomerSupportTickets(customerId: string, maxResults = 50): Promise<readonly SupportTicket[]> {
  return listDocuments<SupportTicket>("supportTickets", [where("customerId", "==", customerId), orderBy("createdAt", "desc")], maxResults);
}

export function createSupportTicket(ticket: Omit<SupportTicket, "createdAt" | "updatedAt" | "closedAt">): Promise<void> {
  return setDocument("supportTickets", ticket.ticketId, {
    ...ticket,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    closedAt: null,
  });
}

export function updateSupportTicketStatus(ticketId: string, status: SupportTicketStatus): Promise<void> {
  return updateDocument<SupportTicket>("supportTickets", ticketId, {
    status,
    updatedAt: serverTimestamp(),
    ...(status === "closed" ? { closedAt: serverTimestamp() } : {}),
  });
}

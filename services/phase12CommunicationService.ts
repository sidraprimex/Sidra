import {
  collection,
  doc,
  getDoc,
  orderBy,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { callSidraFunction } from "@/services/functionService";
import { listDocuments } from "@/services/firestoreRepository";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type { Message } from "@/types/communication";
import type {
  CreateSupportTicketInput,
  Phase12SupportStatus,
  Phase12SupportTicket,
} from "@/types/phase12-communication";

function requireSignedInUser() {
  const services = requireFirebaseServices();
  const user = services.auth.currentUser;

  if (!user) {
    throw new Error("unauthenticated: Please sign in again.");
  }

  return { ...services, user };
}

export async function createPhase12SupportTicket(
  input: CreateSupportTicketInput,
): Promise<{ ticketId: string }> {
  const subject = input.subject.trim();
  const description = input.description.trim();

  if (subject.length < 5 || description.length < 10) {
    throw new Error(
      "invalid-argument: Complete the support request before submitting.",
    );
  }

  return callSidraFunction("createSupportTicket", {
    subject,
    description,
    category: input.category,
    orderId: input.orderId?.trim() || null,
    productId: input.productId?.trim() || null,
  });
}

export async function sendPhase12SupportMessage(
  ticketId: string,
  body: string,
): Promise<{ delivered: boolean }> {
  const { db, user } = requireSignedInUser();
  const cleanBody = body.trim();

  if (!cleanBody) {
    throw new Error("invalid-argument: Message is required.");
  }

  const ticketRef = doc(db, "supportTickets", ticketId);
  const snapshot = await getDoc(ticketRef);

  if (!snapshot.exists()) {
    throw new Error("not-found: Support request not found.");
  }

  const ticket = snapshot.data() as Phase12SupportTicket;

  if (ticket.status === "closed") {
    throw new Error("failed-precondition: This support request is closed.");
  }

  const messageRef = doc(collection(db, "messages"));
  const recipientUids = [
    ticket.customerId,
    ticket.assignedAdminUid,
  ].filter(
    (value): value is string =>
      typeof value === "string" && value !== user.uid,
  );

  const batch = writeBatch(db);

  batch.set(messageRef, {
    messageId: messageRef.id,
    conversationId: ticket.conversationId,
    contextType: "supportTicket",
    contextId: ticketId,
    senderUid: user.uid,
    recipientUids,
    body: cleanBody,
    attachmentUrls: [],
    createdAt: serverTimestamp(),
    editedAt: null,
    deleted: false,
    system: false,
  });

  batch.update(ticketRef, {
    updatedAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
    ...(ticket.status === "waitingOnCustomer"
      ? { status: "inProgress" }
      : {}),
  });

  await batch.commit();

  return { delivered: true };
}

export async function managePhase12SupportTicket(
  ticketId: string,
  status: Phase12SupportStatus,
  assignedAdminUid?: string,
): Promise<{ updated: boolean }> {
  const { db } = requireSignedInUser();
  await updateDoc(doc(db, "supportTickets", ticketId), {
    status,
    ...(assignedAdminUid !== undefined ? { assignedAdminUid } : {}),
    updatedAt: serverTimestamp(),
    ...(status === "closed" ? { closedAt: serverTimestamp() } : {}),
  });
  return { updated: true };
}

export function markEveryNotificationRead(): Promise<{
  updatedCount: number;
}> {
  return callSidraFunction("markAllNotificationsRead", {});
}

export function listMySupportTickets(
  uid: string,
  maxResults = 50,
): Promise<readonly Phase12SupportTicket[]> {
  return listDocuments(
    "supportTickets",
    [
      where("openedByUid", "==", uid),
      orderBy("updatedAt", "desc"),
    ],
    maxResults,
  );
}

export function listSupportQueue(
  maxResults = 100,
): Promise<readonly Phase12SupportTicket[]> {
  return listDocuments(
    "supportTickets",
    [orderBy("updatedAt", "desc")],
    maxResults,
  );
}

export function listSupportConversation(
  conversationId: string,
  maxResults = 100,
): Promise<readonly Message[]> {
  return listDocuments(
    "messages",
    [
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "asc"),
    ],
    maxResults,
  );
}

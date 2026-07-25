import { randomUUID } from "node:crypto";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { canTransitionSupportStatus, cleanText, isSupportCategory, isSupportStatus } from "./communicationPolicy.js";

function requireAuth(request: { auth?: { uid: string; token: Record<string, unknown> } }): { uid: string; role: string; studioId: string | null } {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Sign in is required.");
  return { uid: request.auth.uid, role: String(request.auth.token.role ?? "customer"), studioId: typeof request.auth.token.studioId === "string" ? request.auth.token.studioId : null };
}
function isSupportRole(role: string): boolean { return ["support", "founder", "superAdmin"].includes(role); }

export const createSupportTicket = onCall(async (request) => {
  const actor = requireAuth(request); const subject = cleanText(request.data?.subject, 140); const description = cleanText(request.data?.description, 5000); const category = cleanText(request.data?.category, 40);
  if (subject.length < 5 || description.length < 10 || !isSupportCategory(category)) throw new HttpsError("invalid-argument", "Complete the support request before submitting.");
  const db = getFirestore(); const ticketRef = db.collection("supportTickets").doc(); const conversationId = randomUUID();
  const orderId = cleanText(request.data?.orderId, 128) || null; const productId = cleanText(request.data?.productId, 128) || null;
  if (orderId) { const order = await db.collection("orders").doc(orderId).get(); const data = order.data(); if (!order.exists || (data?.customerId !== actor.uid && data?.studioId !== actor.studioId && !isSupportRole(actor.role))) throw new HttpsError("permission-denied", "Order context denied."); }
  await ticketRef.set({ ticketId: ticketRef.id, customerId: actor.role === "customer" ? actor.uid : null, studioId: actor.role === "seller" ? actor.studioId : null, openedByUid: actor.uid, assignedAdminUid: null, subject, category, description, orderId, productId, attachmentUrls: [], conversationId, status: "open", priority: "normal", satisfactionRating: null, lastMessageAt: FieldValue.serverTimestamp(), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), closedAt: null });
  await db.collection("messages").add({ conversationId, contextType: "supportTicket", contextId: ticketRef.id, senderUid: actor.uid, recipientUids: [], body: description, attachmentUrls: [], createdAt: FieldValue.serverTimestamp(), editedAt: null, deleted: false, system: false });
  return { ticketId: ticketRef.id };
});

export const sendSupportMessage = onCall(async (request) => {
  const actor = requireAuth(request); const ticketId = cleanText(request.data?.ticketId, 128); const body = cleanText(request.data?.body, 5000);
  if (!ticketId || body.length < 1) throw new HttpsError("invalid-argument", "Message is required.");
  const db = getFirestore(); const ref = db.collection("supportTickets").doc(ticketId); const snap = await ref.get(); if (!snap.exists) throw new HttpsError("not-found", "Support request not found.");
  const ticket = snap.data()!; const participant = ticket.customerId === actor.uid || ticket.studioId === actor.studioId || isSupportRole(actor.role); if (!participant) throw new HttpsError("permission-denied", "Conversation access denied."); if (ticket.status === "closed") throw new HttpsError("failed-precondition", "Closed requests cannot receive new messages.");
  const recipients = [ticket.customerId, ticket.assignedAdminUid].filter((v): v is string => typeof v === "string" && v !== actor.uid);
  await db.collection("messages").add({ conversationId: ticket.conversationId, contextType: "supportTicket", contextId: ticketId, senderUid: actor.uid, recipientUids: recipients, body, attachmentUrls: [], createdAt: FieldValue.serverTimestamp(), editedAt: null, deleted: false, system: false });
  await ref.update({ updatedAt: FieldValue.serverTimestamp(), lastMessageAt: FieldValue.serverTimestamp(), ...(actor.role === "customer" && ticket.status === "waitingOnCustomer" ? { status: "inProgress" } : {}) });
  return { delivered: true };
});

export const manageSupportTicket = onCall(async (request) => {
  const actor = requireAuth(request); if (!isSupportRole(actor.role)) throw new HttpsError("permission-denied", "Support access required.");
  const ticketId = cleanText(request.data?.ticketId, 128); const status = cleanText(request.data?.status, 40); if (!ticketId || !isSupportStatus(status)) throw new HttpsError("invalid-argument", "Valid ticket and status are required.");
  const db = getFirestore(); const ref = db.collection("supportTickets").doc(ticketId); const snap = await ref.get(); if (!snap.exists) throw new HttpsError("not-found", "Support request not found."); const current = String(snap.data()?.status ?? "open"); if (current !== status && !canTransitionSupportStatus(current, status)) throw new HttpsError("failed-precondition", `Cannot move ${current} to ${status}.`);
  const assignee = cleanText(request.data?.assignedAdminUid, 128) || actor.uid; await ref.update({ status, assignedAdminUid: assignee, updatedAt: FieldValue.serverTimestamp(), ...(status === "closed" ? { closedAt: FieldValue.serverTimestamp() } : {}) });
  await db.collection("auditLogs").add({ action: "supportTicketStatusChanged", actorUid: actor.uid, entityType: "supportTicket", entityId: ticketId, metadata: { from: current, to: status, assignedAdminUid: assignee }, createdAt: FieldValue.serverTimestamp() });
  return { updated: true };
});

export const markAllNotificationsRead = onCall(async (request) => {
  const actor = requireAuth(request); const db = getFirestore(); const snapshot = await db.collection("notifications").where("recipientUid", "==", actor.uid).where("read", "==", false).limit(200).get(); const batch = db.batch(); snapshot.docs.forEach((doc) => batch.update(doc.ref, { read: true, readAt: FieldValue.serverTimestamp() })); await batch.commit(); return { updatedCount: snapshot.size };
});

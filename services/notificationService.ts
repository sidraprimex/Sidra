import { orderBy, serverTimestamp, where } from "firebase/firestore";
import { listDocuments, updateDocument } from "@/services/firestoreRepository";
import type { Notification } from "@/types/communication";

export function listNotifications(uid: string, maxResults = 50): Promise<readonly Notification[]> {
  return listDocuments<Notification>("notifications", [where("recipientUid", "==", uid), orderBy("createdAt", "desc")], maxResults);
}

export function markNotificationRead(notificationId: string): Promise<void> {
  return updateDocument<Notification>("notifications", notificationId, { read: true, readAt: serverTimestamp() });
}

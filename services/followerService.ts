import { serverTimestamp, where } from "firebase/firestore";
import { deleteDocument, listDocuments, setDocument } from "@/services/firestoreRepository";
import type { Follower } from "@/types/engagement";

export function followerDocumentId(customerId: string, studioId: string): string {
  return `${customerId}_${studioId}`;
}

export function followStudio(customerId: string, studioId: string): Promise<void> {
  const followerId = followerDocumentId(customerId, studioId);
  return setDocument("followers", followerId, { followerId, customerId, studioId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export function unfollowStudio(customerId: string, studioId: string): Promise<void> {
  return deleteDocument("followers", followerDocumentId(customerId, studioId));
}

export function listFollowedStudios(customerId: string, maxResults = 100): Promise<readonly Follower[]> {
  return listDocuments<Follower>("followers", [where("customerId", "==", customerId)], maxResults);
}

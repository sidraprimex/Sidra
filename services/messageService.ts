import { orderBy, serverTimestamp, where } from "firebase/firestore";
import { listDocuments, setDocument } from "@/services/firestoreRepository";
import type { Message, MessageContextType } from "@/types/communication";

export function listConversationMessages(conversationId: string, maxResults = 100): Promise<readonly Message[]> {
  return listDocuments<Message>("messages", [where("conversationId", "==", conversationId), orderBy("createdAt", "asc")], maxResults);
}

export function sendContextMessage(input: {
  readonly messageId: string;
  readonly conversationId: string;
  readonly contextType: MessageContextType;
  readonly contextId: string;
  readonly senderUid: string;
  readonly recipientUids: readonly string[];
  readonly body: string;
  readonly attachmentUrls: readonly string[];
}): Promise<void> {
  return setDocument("messages", input.messageId, {
    ...input,
    createdAt: serverTimestamp(),
    editedAt: null,
    deleted: false,
  });
}

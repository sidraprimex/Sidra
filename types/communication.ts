import type { DateTimeValue } from "@/types/firestore";

export type NotificationAudience = "customer" | "seller" | "admin";
export type NotificationChannel = "inApp" | "email";

export interface Notification {
  readonly notificationId: string;
  readonly recipientUid: string;
  readonly audience: NotificationAudience;
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly channels: readonly NotificationChannel[];
  readonly read: boolean;
  readonly actionUrl: string | null;
  readonly contextType: string | null;
  readonly contextId: string | null;
  readonly createdAt: DateTimeValue;
  readonly readAt: DateTimeValue;
}

export type MessageContextType = "productInquiry" | "customOrder" | "supportTicket";

export interface Message {
  readonly messageId: string;
  readonly conversationId: string;
  readonly contextType: MessageContextType;
  readonly contextId: string;
  readonly senderUid: string;
  readonly recipientUids: readonly string[];
  readonly body: string;
  readonly attachmentUrls: readonly string[];
  readonly createdAt: DateTimeValue;
  readonly editedAt: DateTimeValue;
  readonly deleted: boolean;
}

export type SupportTicketStatus = "open" | "assigned" | "inProgress" | "waitingOnCustomer" | "resolved" | "closed";

export interface SupportTicket {
  readonly ticketId: string;
  readonly customerId: string | null;
  readonly studioId: string | null;
  readonly assignedAdminUid: string | null;
  readonly subject: string;
  readonly category: string;
  readonly description: string;
  readonly orderId: string | null;
  readonly productId: string | null;
  readonly attachmentUrls: readonly string[];
  readonly conversationId: string;
  readonly status: SupportTicketStatus;
  readonly satisfactionRating: number | null;
  readonly createdAt: DateTimeValue;
  readonly updatedAt: DateTimeValue;
  readonly closedAt: DateTimeValue;
}

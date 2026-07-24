export interface FirestoreTimestampLike {
  readonly seconds: number;
  readonly nanoseconds: number;
  toDate?: () => Date;
}

export type DateTimeValue = Date | FirestoreTimestampLike | string | null;

export interface AuditedDocument {
  readonly createdAt: DateTimeValue;
  readonly updatedAt: DateTimeValue;
}

export interface PostalAddress {
  readonly recipientName: string;
  readonly mobile: string;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly state: string;
  readonly country: "India";
  readonly pinCode: string;
}

export type CurrencyCode = "INR";

export interface PageCursor {
  readonly id: string;
  readonly createdAt?: DateTimeValue;
}

export interface ListQueryOptions {
  readonly limit?: number;
  readonly cursor?: PageCursor | null;
}

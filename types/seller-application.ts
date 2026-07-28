import type { DateTimeValue } from "@/types/firestore";

export const SELLER_APPLICATION_STATUSES = [
  "pending",
  "approved",
  "paymentSubmitted",
  "rejected",
  "moreInfoRequested",
  "onHold",
  "provisioning",
  "provisioned",
  "provisioningFailed",
] as const;

export type SellerApplicationStatus = (typeof SELLER_APPLICATION_STATUSES)[number];
export type SellerApplicationDecision = "approve" | "reject" | "requestMoreInfo" | "hold";
export type SellerAccessPaymentMethod = "manual" | "razorpayLink";

export interface SellerPortfolioImage {
  path: string;
  downloadUrl: string;
  fileName: string;
  contentType: string;
  size: number;
}

export interface SellerApplicationInput {
  fullName: string;
  studioName: string;
  email: string;
  mobile: string;
  city: string;
  state: string;
  portfolioImages: SellerPortfolioImage[];
  instagram: string | null;
  experience: string;
  productCategories: string[];
  whyJoin: string;
  expectedMonthlyCapacity: number;
}

export interface SellerApplication extends SellerApplicationInput {
  id: string;
  uid: string;
  status: SellerApplicationStatus;
  reviewNote: string | null;
  reviewedBy: string | null;
  studioId: string | null;
  slug: string | null;
  failureReason: string | null;
  accessFeePaise: number;
  paymentMethod: SellerAccessPaymentMethod | null;
  paymentReference: string | null;
  createdAt: DateTimeValue;
  updatedAt: DateTimeValue;
  reviewedAt: DateTimeValue;
  paymentSubmittedAt: DateTimeValue;
  paymentVerifiedAt: DateTimeValue;
  provisionedAt: DateTimeValue;
}

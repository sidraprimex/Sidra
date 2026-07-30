import type { DateTimeValue } from "@/types/firestore";
import type { CartLineItem } from "@/types/phase6-commerce";
import type { SidraPaymentMode } from "@/types/admin-os";

export interface CheckoutPaymentSettings {
  readonly mode: SidraPaymentMode;
  readonly razorpayEnabled: boolean;
  readonly manualEnabled: boolean;
  readonly razorpayPaymentLink: string;
  readonly sellerAccessFeePaise: number;
  readonly upiId: string;
  readonly accountHolderName: string;
  readonly bankName: string;
  readonly accountNumber: string;
  readonly ifsc: string;
  readonly instructions: string;
  readonly supportContact: string;
}

export type ManualPaymentStatus = "pendingVerification" | "verified" | "rejected";

export interface ManualPaymentRequest {
  readonly requestId: string;
  readonly customerId: string;
  readonly addressId: string;
  readonly items: readonly CartLineItem[];
  readonly subtotalPaise: number;
  readonly shippingPaise: number;
  readonly totalPaise: number;
  readonly paymentReference: string;
  readonly acceptedPolicies: Readonly<Record<string, string>>;
  readonly status: ManualPaymentStatus;
  readonly adminNote: string | null;
  readonly verifiedBy: string | null;
  readonly createdAt: DateTimeValue;
  readonly updatedAt: DateTimeValue;
}

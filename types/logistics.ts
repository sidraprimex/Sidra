import type { DateTimeValue } from "@/types/firestore";

export type ShippingCostAllocation =
  | "buyerPaid"
  | "includedInPrice"
  | "sidraSponsored"
  | "adminSplit";

export interface LogisticsSettings {
  readonly enabled: boolean;
  readonly primaryProvider: "delhivery";
  readonly backupProvider: "none" | "blueDart";
  readonly defaultPickupLocation: string;
  readonly shippingCostAllocation: ShippingCostAllocation;
  readonly sellerShareBasisPoints: number;
  readonly buyerShareBasisPoints: number;
  readonly requireDeliveryOtp: boolean;
  readonly protectHighValueShipments: boolean;
  readonly protectThresholdPaise: number;
  readonly pickupLeadHours: number;
  readonly ndrMaxReattempts: number;
  readonly buyerCancellationFeePaise: number;
  readonly buyerCausedReturnRecoveryEnabled: boolean;
  readonly claimWindowHours: number;
}

export interface SellerKycSettings {
  readonly enabled: boolean;
  readonly level: "basic" | "standard" | "enhanced";
  readonly requirePan: boolean;
  readonly requireIdentityProof: boolean;
  readonly acceptedIdentityProofs: readonly ("aadhaar" | "voterId" | "passport")[];
  readonly requireBankDetails: boolean;
  readonly requirePickupAddress: boolean;
  readonly documentStorageProvider: "b2";
}

export interface SellerVerification {
  readonly studioId: string;
  readonly sellerUid: string;
  readonly status: "draft" | "submitted" | "verified" | "rejected";
  readonly legalName: string;
  readonly panLastFour: string;
  readonly identityProofType: "aadhaar" | "voterId" | "passport" | null;
  readonly identityProofLastFour: string;
  readonly pickupAddress: {
    readonly name: string;
    readonly phone: string;
    readonly email: string;
    readonly line1: string;
    readonly line2: string;
    readonly city: string;
    readonly state: string;
    readonly postalCode: string;
    readonly country: "India";
  };
  readonly bankAccountLastFour: string;
  readonly ifsc: string;
  readonly documentPaths: readonly string[];
  readonly adminNote: string | null;
  readonly submittedAt: DateTimeValue;
  readonly reviewedAt: DateTimeValue;
  readonly updatedAt: DateTimeValue;
}

export interface ShipmentEvent {
  readonly code: string;
  readonly status: string;
  readonly statusType: string;
  readonly location: string;
  readonly instructions: string;
  readonly occurredAt: string;
}

export interface SidraShipment {
  readonly provider: "delhivery";
  readonly awb: string;
  readonly providerOrderId: string;
  readonly pickupRequestId: string | null;
  readonly pickupLocation: string;
  readonly labelAvailable: boolean;
  readonly status: string;
  readonly statusType: string;
  readonly expectedDeliveryDate: string | null;
  readonly lastLocation: string | null;
  readonly events: readonly ShipmentEvent[];
  readonly shippingChargePaise: number | null;
  readonly costAllocation: ShippingCostAllocation;
  readonly createdAt: string;
  readonly updatedAt: string;
}

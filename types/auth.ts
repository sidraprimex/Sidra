import type { DateTimeValue } from "@/types/firestore";

export const SIDRA_ROLES = [
  "visitor",
  "customer",
  "seller",
  "admin",
  "support",
  "contentManager",
  "financeManager",
  "marketingManager",
  "founder",
  "superAdmin",
] as const;

export type SidraRole = (typeof SIDRA_ROLES)[number];
export type AccountStatus = "active" | "suspended" | "deleted";

export interface NotificationPreferences {
  readonly transactional: boolean;
  readonly studioUpdates: boolean;
  readonly editorial: boolean;
  readonly marketing: boolean;
}

export interface UserProfile {
  readonly uid: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly role: SidraRole;
  readonly studioId: string | null;
  readonly profilePhoto: string | null;
  readonly status: AccountStatus;
  readonly emailVerified: boolean;
  readonly preferredLanguage: "en";
  readonly notificationPreferences: NotificationPreferences;
  readonly wishlistCount: number;
  readonly orderCount: number;
  readonly loyaltyPoints: number;
  readonly createdAt: DateTimeValue;
  readonly updatedAt: DateTimeValue;
  readonly lastLoginAt: DateTimeValue;
}

export interface AuthClaims {
  readonly role: SidraRole;
  readonly studioId?: string;
}

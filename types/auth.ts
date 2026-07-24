import type { Timestamp } from "firebase/firestore";

export const SIDRA_ROLES = [
  "visitor",
  "customer",
  "seller",
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
  transactional: boolean;
  studioUpdates: boolean;
  editorial: boolean;
  marketing: boolean;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: SidraRole;
  studioId: string | null;
  profilePhoto: string | null;
  status: AccountStatus;
  emailVerified: boolean;
  preferredLanguage: "en";
  notificationPreferences: NotificationPreferences;
  wishlistCount: number;
  orderCount: number;
  loyaltyPoints: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  lastLoginAt: Timestamp | null;
}

export interface AuthClaims {
  role: SidraRole;
  studioId?: string;
}

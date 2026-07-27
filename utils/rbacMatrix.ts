export const ADMIN_ROLES = [
  "admin",
  "support",
  "contentManager",
  "financeManager",
  "marketingManager",
  "founder",
  "superAdmin",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AdminAction =
  | "support.read"
  | "support.manage"
  | "content.manage"
  | "finance.read"
  | "finance.manage"
  | "marketing.manage"
  | "security.read"
  | "security.manage"
  | "roles.manage"
  | "audit.read"
  | "release.manage";

const FULL_ADMIN_ACCESS: readonly AdminAction[] = [
  "support.read",
  "support.manage",
  "content.manage",
  "finance.read",
  "finance.manage",
  "marketing.manage",
  "security.read",
  "security.manage",
  "roles.manage",
  "audit.read",
  "release.manage",
];

export const RBAC_MATRIX: Readonly<Record<AdminRole, readonly AdminAction[]>> = Object.freeze({
  admin: FULL_ADMIN_ACCESS,
  support: ["support.read", "support.manage"],
  contentManager: ["content.manage"],
  financeManager: ["finance.read", "finance.manage"],
  marketingManager: ["marketing.manage"],
  founder: FULL_ADMIN_ACCESS,
  superAdmin: FULL_ADMIN_ACCESS,
});

export function roleCan(role: string, action: AdminAction): boolean {
  return ADMIN_ROLES.includes(role as AdminRole) && RBAC_MATRIX[role as AdminRole].includes(action);
}

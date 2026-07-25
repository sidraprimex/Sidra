export const ADMIN_ROLES = ["support", "contentManager", "financeManager", "marketingManager", "founder", "superAdmin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AdminAction = "support.read" | "support.manage" | "content.manage" | "finance.read" | "finance.manage" | "marketing.manage" | "security.read" | "security.manage" | "roles.manage" | "audit.read" | "release.manage";

export const RBAC_MATRIX: Readonly<Record<AdminRole, readonly AdminAction[]>> = Object.freeze({
  support: ["support.read", "support.manage"],
  contentManager: ["content.manage"],
  financeManager: ["finance.read", "finance.manage"],
  marketingManager: ["marketing.manage"],
  founder: ["support.read", "support.manage", "content.manage", "finance.read", "finance.manage", "marketing.manage", "security.read", "security.manage", "roles.manage", "audit.read", "release.manage"],
  superAdmin: ["support.read", "support.manage", "content.manage", "finance.read", "finance.manage", "marketing.manage", "security.read", "security.manage", "roles.manage", "audit.read", "release.manage"],
});

export function roleCan(role: string, action: AdminAction): boolean {
  return ADMIN_ROLES.includes(role as AdminRole) && RBAC_MATRIX[role as AdminRole].includes(action);
}

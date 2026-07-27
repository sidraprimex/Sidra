export const SIDRA_ADMIN_EMAIL = "syedafsharkhadri63@gmail.com";

export function isConfiguredAdminEmail(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === SIDRA_ADMIN_EMAIL;
}

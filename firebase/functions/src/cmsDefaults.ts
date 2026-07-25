export interface SellerWelcomeTemplate {
  subject: string;
  text: string;
  html: string;
}

export const DEFAULT_SELLER_WELCOME_TEMPLATE: SellerWelcomeTemplate = Object.freeze({
  subject: "Your Sidra Studio is ready",
  text: "Hello {{fullName}},\n\n{{studioName}} is now prepared inside Sidra.\n\nStudio: {{studioUrl}}\nDashboard: {{dashboardUrl}}",
  html: "<p>Hello {{fullName}},</p><p><strong>{{studioName}}</strong> is now prepared inside Sidra.</p><p><a href=\"{{studioUrl}}\">Enter the Studio</a></p><p><a href=\"{{dashboardUrl}}\">Open the Studio dashboard</a></p>",
});

export function isSellerWelcomeTemplate(value: unknown): value is SellerWelcomeTemplate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.subject === "string"
    && typeof candidate.text === "string"
    && typeof candidate.html === "string";
}

export function renderCmsTemplate(value: string, data: Record<string, string>): string {
  return value.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => data[key] ?? "");
}

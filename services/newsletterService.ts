export interface NewsletterSubscriptionResult {
  readonly accepted: true;
  readonly alreadySubscribed: boolean;
}

export async function subscribeToNewsletter(
  email: string,
): Promise<NewsletterSubscriptionResult> {
  const response = await fetch("/api/newsletter", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const result = await readJsonResponse<NewsletterSubscriptionResult & { error?: string }>(
    response,
    "Newsletter service is temporarily unavailable.",
  );
  if (!response.ok) throw new Error(result.error ?? "Subscription failed.");
  return result;
}
import { readJsonResponse } from "@/services/httpResponse";

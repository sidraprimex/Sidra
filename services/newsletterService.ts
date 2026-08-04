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
  const result = await response.json() as NewsletterSubscriptionResult & { error?: string };
  if (!response.ok) throw new Error(result.error ?? "Subscription failed.");
  return result;
}

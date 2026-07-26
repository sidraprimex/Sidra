import { httpsCallable } from "firebase/functions";
import { getFirebaseServices } from "@/lib/firebaseClient";

export interface NewsletterSubscriptionResult {
  readonly accepted: true;
  readonly alreadySubscribed: boolean;
}

export async function subscribeToNewsletter(
  email: string,
): Promise<NewsletterSubscriptionResult> {
  const services = getFirebaseServices();

  if (!services) {
    throw new Error(
      "Sidra is not connected to Firebase.",
    );
  }

  const callable = httpsCallable<
    {
      readonly email: string;
    },
    NewsletterSubscriptionResult
  >(
    services.functions,
    "subscribeToNewsletter",
  );

  const result = await callable({
    email,
  });

  return result.data;
}

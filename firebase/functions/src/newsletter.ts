import { createHash } from "node:crypto";
import {
  FieldValue,
  getFirestore,
  Timestamp,
} from "firebase-admin/firestore";
import {
  HttpsError,
  onCall,
} from "firebase-functions/v2/https";

const EMAIL_PATTERN = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAXIMUM_REQUESTS_PER_WINDOW = 12;

function hashValue(value: string): string {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "Enter a valid email address.",
    );
  }

  const email = value.trim().toLowerCase();

  if (
    email.length < 5 ||
    email.length > 254 ||
    !EMAIL_PATTERN.test(email)
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Enter a valid email address.",
    );
  }

  return email;
}

export const subscribeToNewsletter = onCall(
  async (request) => {
    const email = normalizeEmail(request.data?.email);
    const emailHash = hashValue(email);

    const forwardedHeader =
      request.rawRequest.headers["x-forwarded-for"];

    const forwardedIp = Array.isArray(forwardedHeader)
      ? forwardedHeader[0]
      : typeof forwardedHeader === "string"
        ? forwardedHeader.split(",")[0]
        : "";

    const clientIp = (
      forwardedIp ||
      request.rawRequest.ip ||
      "unknown"
    )
      .trim()
      .slice(0, 128);

    const ipHash = hashValue(clientIp);
    const database = getFirestore();
    const now = Timestamp.now();

    const subscriberReference = database
      .collection("newsletterSubscribers")
      .doc(emailHash);

    const rateLimitReference = database
      .collection("newsletterRateLimits")
      .doc(ipHash);

    return database.runTransaction(async (transaction) => {
      const [
        subscriberSnapshot,
        rateLimitSnapshot,
      ] = await Promise.all([
        transaction.get(subscriberReference),
        transaction.get(rateLimitReference),
      ]);

      const rateLimitData = rateLimitSnapshot.data();
      const previousWindow =
        rateLimitData?.windowStartedAt;

      const windowIsActive =
        previousWindow instanceof Timestamp &&
        now.toMillis() - previousWindow.toMillis() <
          RATE_LIMIT_WINDOW_MS;

      const previousAttempts = windowIsActive
        ? Number(rateLimitData?.attempts ?? 0)
        : 0;

      const attempts = Number.isFinite(previousAttempts)
        ? previousAttempts
        : 0;

      if (
        attempts >= MAXIMUM_REQUESTS_PER_WINDOW
      ) {
        throw new HttpsError(
          "resource-exhausted",
          "Too many subscription attempts. Please try again later.",
        );
      }

      transaction.set(
        rateLimitReference,
        {
          attempts: attempts + 1,
          windowStartedAt: windowIsActive
            ? previousWindow
            : now,
          updatedAt: FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      const existingSubscriber =
        subscriberSnapshot.data();

      if (
        existingSubscriber?.status === "active"
      ) {
        transaction.set(
          subscriberReference,
          {
            lastSubmittedAt:
              FieldValue.serverTimestamp(),
            submissionCount:
              FieldValue.increment(1),
            updatedAt:
              FieldValue.serverTimestamp(),
          },
          {
            merge: true,
          },
        );

        return {
          accepted: true,
          alreadySubscribed: true,
        };
      }

      transaction.set(
        subscriberReference,
        {
          email,
          emailHash,
          status: "active",
          source: "homepage",
          consentVersion:
            "homepage-newsletter-v1",
          userId: request.auth?.uid ?? null,
          subscribedAt:
            FieldValue.serverTimestamp(),
          lastSubmittedAt:
            FieldValue.serverTimestamp(),
          unsubscribedAt: null,
          submissionCount:
            FieldValue.increment(1),
          createdAt:
            existingSubscriber?.createdAt ??
            FieldValue.serverTimestamp(),
          updatedAt:
            FieldValue.serverTimestamp(),
        },
        {
          merge: true,
        },
      );

      return {
        accepted: true,
        alreadySubscribed: false,
      };
    });
  },
);

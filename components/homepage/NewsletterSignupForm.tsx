"use client";

import { FirebaseError } from "firebase/app";
import {
  type FormEvent,
  useState,
} from "react";
import { subscribeToNewsletter } from "@/services/newsletterService";

type SubmissionState =
  | "idle"
  | "submitting"
  | "success"
  | "error";

function resolveErrorMessage(
  reason: unknown,
): string {
  if (reason instanceof FirebaseError) {
    if (
      reason.code ===
      "functions/resource-exhausted"
    ) {
      return "Too many attempts. Please try again later.";
    }

    if (
      reason.code ===
      "functions/invalid-argument"
    ) {
      return "Enter a valid email address.";
    }
  }

  return "Subscription could not be completed. Please try again.";
}

export function NewsletterSignupForm(): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [state, setState] =
    useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (
      normalizedEmail.length < 5 ||
      normalizedEmail.length > 254
    ) {
      setState("error");
      setMessage(
        "Enter a valid email address.",
      );
      return;
    }

    setState("submitting");
    setMessage("");

    try {
      const result =
        await subscribeToNewsletter(
          normalizedEmail,
        );

      setEmail("");
      setState("success");
      setMessage(
        result.alreadySubscribed
          ? "You are already part of the Sidra Journal."
          : "Welcome to the Sidra Journal.",
      );
    } catch (reason: unknown) {
      setState("error");
      setMessage(resolveErrorMessage(reason));
    }
  }

  const submitting = state === "submitting";

  return (
    <form
      className="mt-8"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label
          htmlFor="sidra-newsletter-email"
          className="sr-only"
        >
          Email address
        </label>

        <input
          id="sidra-newsletter-email"
          type="email"
          name="email"
          value={email}
          required
          maxLength={254}
          autoComplete="email"
          inputMode="email"
          disabled={submitting}
          placeholder="Your email address"
          onChange={(event) => {
            setEmail(event.target.value);

            if (state !== "idle") {
              setState("idle");
              setMessage("");
            }
          }}
          className="min-h-14 flex-1 rounded-lg border border-gold-500/30 bg-black-950/70 px-5 text-caption text-ivory-100 outline-none transition duration-base placeholder:text-gray-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-14 items-center justify-center rounded-lg bg-gold-500 px-8 text-caption font-semibold text-black-950 shadow-gold-glow transition duration-slow ease-luxury hover:-translate-y-0.5 hover:bg-gold-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? "Joining…"
            : "Join the Journal"}
        </button>
      </div>

      <p className="mt-4 text-micro leading-6 text-gray-500">
        Thoughtful updates only. Your email is
        stored securely and is never shown publicly.
      </p>

      <div
        aria-live="polite"
        className={`mt-4 min-h-6 text-caption ${
          state === "error"
            ? "text-error"
            : "text-gold-100"
        }`}
      >
        {message}
      </div>
    </form>
  );
}

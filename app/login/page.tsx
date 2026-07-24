"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { FormField } from "@/components/auth/FormField";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/Button";
import { loginWithEmail } from "@/services/authService";
import { getAuthErrorMessage } from "@/utils/authErrors";

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const destination = params.get("next") || "/account/overview";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <AuthShell
      eyebrow="Private access"
      title="Return to your collection."
      description="Enter Sidra through the account that holds your orders, saved Studios, and private requests."
      alternate={{
        label: "New to Sidra?",
        href: "/register",
        action: "Create an account",
      }}
    >
      <GoogleSignInButton destination={destination} onError={setError} />
      <AuthDivider />
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          setLoading(true);
          try {
            const user = await loginWithEmail(email, password);
            router.replace(
              user.emailVerified
                ? destination
                : `/verify-email?next=${encodeURIComponent(destination)}`,
            );
          } catch (authError) {
            setError(getAuthErrorMessage(authError));
          } finally {
            setLoading(false);
          }
        }}
      >
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-caption text-gray-300 underline decoration-white/25 underline-offset-4 transition duration-fast hover:text-ivory-100"
          >
            Forgot password?
          </Link>
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-error/35 bg-error/15 px-4 py-3 text-caption text-ivory-100"
          >
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          className="w-full"
        >
          Enter Sidra
        </Button>
      </form>
    </AuthShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<main className="min-h-[100svh] bg-black-950" />}>
      <LoginContent />
    </Suspense>
  );
}

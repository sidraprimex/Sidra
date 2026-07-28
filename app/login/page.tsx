"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppleSignInButton } from "@/components/auth/AppleSignInButton";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { FormField } from "@/components/auth/FormField";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/Button";
import { loginWithEmail } from "@/services/authService";
import { getAuthErrorMessage } from "@/utils/authErrors";

function withSignal(destination: string): string {
  return `${destination}${destination.includes("?") ? "&" : "?"}signedIn=1`;
}

function LoginContent() {
  const params = useSearchParams();
  const destination = params.get("next") || "/account/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <AuthShell
      eyebrow="Private access"
      title="Welcome back to Sidra."
      description="Sign in to continue shopping, track orders, manage your profile, save favourites and contact support."
      alternate={{ label: "New to Sidra?", href: `/register?next=${encodeURIComponent(destination)}`, action: "Create an account" }}
    >
      <div className="grid gap-3">
        <GoogleSignInButton destination={destination} onError={setError} />
        <AppleSignInButton destination={destination} onError={setError} />
      </div>
      <AuthDivider />
      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          setLoading(true);
          try {
            const user = await loginWithEmail(email, password);
            const next = user.emailVerified
              ? destination
              : `/verify-email?next=${encodeURIComponent(destination)}`;
            window.location.assign(withSignal(next));
          } catch (authError) {
            setError(getAuthErrorMessage(authError));
            setLoading(false);
          }
        }}
      >
        <FormField label="Email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <FormField label="Password" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-caption text-white/70 underline decoration-white/25 underline-offset-4 transition hover:text-white">Forgot password?</Link>
        </div>
        {error ? <p role="alert" className="rounded-2xl border border-error/35 bg-error/15 px-4 py-3 text-caption text-ivory-100">{error}</p> : null}
        <Button type="submit" variant="primary" loading={loading} className="w-full">Sign in and continue</Button>
      </form>
    </AuthShell>
  );
}

export default function Page() {
  return <Suspense fallback={<main className="min-h-[100svh] bg-black-950" />}><LoginContent /></Suspense>;
}

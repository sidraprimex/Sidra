"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { refreshIdentity, resendVerificationEmail } from "@/services/authService";
import { getAuthErrorMessage } from "@/utils/authErrors";

function VerifyEmailContent() {
  const auth = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const destination = params.get("next") || "/account/overview";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <AuthShell eyebrow="Email verification" title="Confirm the address that holds your account." description="Open the verification email from Sidra, then return here to continue.">
      <div className="space-y-4">
        <p className="text-body text-gray-300">{auth.user?.email ?? "Sign in first to verify your email."}</p>
        {message ? <p className="rounded-lg border border-success/35 bg-success/15 px-4 py-3 text-caption text-ivory-100">{message}</p> : null}
        {error ? <p className="rounded-lg border border-error/35 bg-error/15 px-4 py-3 text-caption text-ivory-100">{error}</p> : null}
        <Button className="w-full" variant="primary" loading={loading} disabled={!auth.user} onClick={async () => {
          if (!auth.user) return; setLoading(true); setError("");
          try { await refreshIdentity(auth.user); await auth.refresh(); if (auth.user.emailVerified) router.replace(destination); else setMessage("Verification is not complete yet. Open the email link, then check again."); }
          catch (verificationError) { setError(getAuthErrorMessage(verificationError)); }
          finally { setLoading(false); }
        }}>I have verified my email</Button>
        <Button className="w-full" variant="inverseOutline" disabled={!auth.user} onClick={async () => {
          if (!auth.user) return; setError("");
          try { await resendVerificationEmail(auth.user); setMessage("A fresh verification email has been sent."); }
          catch (verificationError) { setError(getAuthErrorMessage(verificationError)); }
        }}>Resend verification email</Button>
      </div>
    </AuthShell>
  );
}

export default function Page() {
  return <Suspense fallback={<main className="min-h-screen bg-black-950" />}><VerifyEmailContent /></Suspense>;
}

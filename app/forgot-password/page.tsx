"use client";

import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/Button";
import { requestPasswordReset } from "@/services/authService";
import { getAuthErrorMessage } from "@/utils/authErrors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <AuthShell eyebrow="Account recovery" title="Restore your private access." description="We will send a secure reset link to the email connected to your Sidra account." alternate={{ label: "Remembered your password?", href: "/login", action: "Return to sign in" }}>
      <form className="space-y-5" onSubmit={async (event) => {
        event.preventDefault(); setError(""); setMessage(""); setLoading(true);
        try { await requestPasswordReset(email); setMessage("A reset link has been sent if this email belongs to a Sidra account."); }
        catch (authError) { setError(getAuthErrorMessage(authError)); }
        finally { setLoading(false); }
      }}>
        <FormField label="Email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        {message ? <p className="rounded-lg border border-success/35 bg-success/15 px-4 py-3 text-caption text-ivory-100">{message}</p> : null}
        {error ? <p className="rounded-lg border border-error/35 bg-error/15 px-4 py-3 text-caption text-ivory-100">{error}</p> : null}
        <Button type="submit" variant="primary" loading={loading} className="w-full">Send reset link</Button>
      </form>
    </AuthShell>
  );
}

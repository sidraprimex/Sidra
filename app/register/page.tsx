"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { FormField } from "@/components/auth/FormField";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { Button } from "@/components/ui/Button";
import { registerWithEmail } from "@/services/authService";
import { getAuthErrorMessage } from "@/utils/authErrors";

export default function RegisterPage() {
  const router = useRouter();
  const [values, setValues] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <AuthShell eyebrow="Collector account" title="Begin with one trusted identity." description="A Sidra account is free for collectors. Studio access remains a separate, curated review process." alternate={{ label: "Already have an account?", href: "/login", action: "Sign in" }}>
      <GoogleSignInButton onError={setError} />
      <AuthDivider />
      <form className="space-y-5" onSubmit={async (event) => {
        event.preventDefault(); setError(""); setLoading(true);
        try { await registerWithEmail(values); router.replace("/verify-email?next=/account/overview"); }
        catch (authError) { setError(getAuthErrorMessage(authError)); }
        finally { setLoading(false); }
      }}>
        <FormField label="Full name" autoComplete="name" required minLength={2} value={values.fullName} onChange={(event) => setValues((current) => ({ ...current, fullName: event.target.value }))} />
        <FormField label="Email" type="email" autoComplete="email" required value={values.email} onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))} />
        <FormField label="Password" type="password" autoComplete="new-password" required minLength={8} value={values.password} onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))} />
        {error ? <p className="rounded-lg border border-error/35 bg-error/15 px-4 py-3 text-caption text-ivory-100">{error}</p> : null}
        <Button type="submit" variant="primary" loading={loading} className="w-full">Create account</Button>
      </form>
    </AuthShell>
  );
}

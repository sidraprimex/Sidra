"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

export function PrivateDocumentLinks({ paths, ownerUid }: { readonly paths: readonly string[]; readonly ownerUid: string }): React.JSX.Element {
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  return <div className="mt-4 grid gap-2">
    {paths.map((path, index) => <Button key={path} variant="outline" loading={busy === path} onClick={async () => {
      if (!user) return;
      setBusy(path); setMessage("");
      try {
        const token = await user.getIdToken();
        const query = new URLSearchParams({ path, ownerUid });
        const response = await fetch(`/api/media/b2/file?${query.toString()}`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
        if (!response.ok) throw new Error("Private document could not be opened.");
        const url = URL.createObjectURL(await response.blob());
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Document could not be opened."); }
      finally { setBusy(null); }
    }}>Open private document {index + 1}</Button>)}
    {message ? <p className="text-xs text-rose-800">{message}</p> : null}
  </div>;
}

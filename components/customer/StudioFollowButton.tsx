"use client";

import { useState } from "react";
import { toggleStudioFollow } from "@/services/customerEngagementService";

export function StudioFollowButton({
  studioId,
  initialFollowed,
}: {
  readonly studioId: string;
  readonly initialFollowed: boolean;
}): React.JSX.Element {
  const [followed, setFollowed] = useState(initialFollowed);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      const result = await toggleStudioFollow(studioId);
      setFollowed(result.active);
    } finally {
      setBusy(false);
    }
  };

  return <button disabled={busy} onClick={() => void toggle()} className={followed
    ? "rounded-[var(--radius-md)] border border-border px-5 py-3 disabled:opacity-50"
    : "rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50"}>
    {busy ? "Updating…" : followed ? "Following" : "Follow Studio"}
  </button>;
}

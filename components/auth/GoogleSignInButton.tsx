"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { loginWithGoogle } from "@/services/authService";
import { getAuthErrorMessage } from "@/utils/authErrors";

function withSignal(destination: string): string {
  return `${destination}${destination.includes("?") ? "&" : "?"}signedIn=1`;
}

export function GoogleSignInButton({
  destination = "/account/dashboard",
  onError,
}: {
  readonly destination?: string;
  readonly onError?: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="inverseOutline"
      loading={loading}
      className="w-full"
      onClick={async () => {
        setLoading(true);
        onError?.("");
        try {
          await loginWithGoogle();
          window.location.assign(withSignal(destination));
        } catch (error) {
          onError?.(getAuthErrorMessage(error));
          setLoading(false);
        }
      }}
    >
      Continue with Google
    </Button>
  );
}

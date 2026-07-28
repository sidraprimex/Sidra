"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { loginWithApple } from "@/services/authService";
import { getAuthErrorMessage } from "@/utils/authErrors";

function withSignal(destination: string): string {
  return `${destination}${destination.includes("?") ? "&" : "?"}signedIn=1`;
}

export function AppleSignInButton({
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
          await loginWithApple();
          window.location.assign(withSignal(destination));
        } catch (error) {
          onError?.(getAuthErrorMessage(error));
          setLoading(false);
        }
      }}
    >
      Continue with Apple
    </Button>
  );
}

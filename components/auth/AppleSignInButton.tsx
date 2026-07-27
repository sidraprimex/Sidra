"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { loginWithApple } from "@/services/authService";
import { getAuthErrorMessage } from "@/utils/authErrors";

export function AppleSignInButton({
  destination = "/search",
  onError,
}: {
  readonly destination?: string;
  readonly onError?: (message: string) => void;
}) {
  const router = useRouter();
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
          router.replace(`${destination}${destination.includes("?") ? "&" : "?"}signedIn=1`);
          router.refresh();
        } catch (error) {
          onError?.(getAuthErrorMessage(error));
        } finally {
          setLoading(false);
        }
      }}
    >
      Continue with Apple
    </Button>
  );
}

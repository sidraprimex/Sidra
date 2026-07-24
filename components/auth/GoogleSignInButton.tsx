"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { loginWithGoogle } from "@/services/authService";
import { getAuthErrorMessage } from "@/utils/authErrors";

export function GoogleSignInButton({ destination = "/account/overview", onError }: { destination?: string; onError?: (message: string) => void }) {
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
        try {
          await loginWithGoogle();
          router.replace(destination);
        } catch (error) {
          onError?.(getAuthErrorMessage(error));
        } finally {
          setLoading(false);
        }
      }}
    >
      Continue with Google
    </Button>
  );
}

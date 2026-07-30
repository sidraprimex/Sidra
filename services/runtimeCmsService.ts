import {
  doc,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseServices } from "@/services/firebaseClient";

export interface RuntimePolicyOverride {
  readonly eyebrow?: string;
  readonly title?: string;
  readonly body?: string;
}

export interface RuntimeTextOverride {
  readonly from: string;
  readonly to: string;
  readonly enabled?: boolean;
}

export function watchRuntimePolicy(
  policyId: "privacy" | "noRefund" | "shipping" | "terms" | "cancellation" | "damageClaims" | "sellerAgreement" | "payoutRecovery",
  onValue: (value: RuntimePolicyOverride | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const services = getFirebaseServices();

  if (!services) {
    onValue(null);
    return () => undefined;
  }

  return onSnapshot(
    doc(services.db, "cms", "policies"),
    (snapshot) => {
      const data = snapshot.data() as
        | Record<string, RuntimePolicyOverride>
        | undefined;

      onValue(data?.[policyId] ?? null);
    },
    (error) => {
      onValue(null);
      onError?.(error);
    },
  );
}

export function watchRuntimeTextOverrides(
  onValue: (values: readonly RuntimeTextOverride[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const services = getFirebaseServices();

  if (!services) {
    onValue([]);
    return () => undefined;
  }

  return onSnapshot(
    doc(services.db, "cms", "textOverrides"),
    (snapshot) => {
      const data = snapshot.data() as
        | { replacements?: readonly RuntimeTextOverride[] }
        | undefined;

      onValue(
        Array.isArray(data?.replacements)
          ? data.replacements
          : [],
      );
    },
    (error) => {
      onValue([]);
      onError?.(error);
    },
  );
}

import {
  customerStageLabel,
  customerTrackingStages,
  toCustomerTrackingStage,
} from "@/utils/orderLifecycle";
import type { OrderStatus } from "@/types/phase7-orders";

export function CustomerTrackingBar({ status }: { readonly status: OrderStatus }): React.JSX.Element {
  const current = toCustomerTrackingStage(status);
  const activeIndex = customerTrackingStages.indexOf(current);
  return <ol className="grid gap-3 sm:grid-cols-5" aria-label="Order tracking">
    {customerTrackingStages.map((stage, index) => <li key={stage} className={`rounded-[var(--radius-md)] border p-4 text-sm ${index <= activeIndex ? "border-[var(--color-gold-600)] bg-card" : "border-border text-muted"}`}>
      <span className="block text-xs uppercase tracking-[0.16em]">{index + 1}</span>
      <span className="mt-2 block font-medium">{customerStageLabel(stage)}</span>
    </li>)}
  </ol>;
}

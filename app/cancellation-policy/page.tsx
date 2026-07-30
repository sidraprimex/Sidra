import { LegalPolicyPage } from "@/components/legal/LegalPolicyPage";

export default function CancellationPolicyPage(): React.JSX.Element {
  return <LegalPolicyPage policyId="cancellation" eyebrow="Prepaid luxury marketplace" title="Cancellation & Refund Policy">
    <p>Sidra orders are prepaid. Many pieces are handmade or personalised. A change-of-mind cancellation is not available after the Studio accepts the order or production begins. Before that point, Sidra may approve a cancellation after deducting payment-provider charges and any work already completed.</p>
    <p>If a buyer supplies an incorrect or incomplete address, remains unavailable for courier calls or delivery OTP, refuses delivery, or otherwise causes delivery failure, Sidra may deduct the actual forward shipping, Return to Origin shipping and other reasonable costs disclosed for that order from the refundable amount.</p>
    <p>A valid claim for non-delivery, materially wrong goods or transit damage is handled under the Damage & Claims Policy. This policy does not remove non-waivable rights available under Indian law.</p>
    <p>Refunds, when approved, are returned to the original payment method or another verified destination. Processing time depends on the payment provider and banking network.</p>
  </LegalPolicyPage>;
}

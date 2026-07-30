import { LegalPolicyPage } from "@/components/legal/LegalPolicyPage";

export default function PayoutRecoveryPolicyPage(): React.JSX.Element {
  return <LegalPolicyPage policyId="payoutRecovery" eyebrow="Transparent settlement" title="Seller Payout & Recovery Policy">
    <p>Buyer money is received by Sidra. Courier charges are paid through Sidra&apos;s Delhivery wallet and allocated in the order ledger according to the founder&apos;s published shipping setting. A seller is not asked to pay the courier agent from personal funds.</p>
    <p>Made-to-order costs may be released in configured stages after payment verification and evidence. Profit, minus the active plan&apos;s commission on verified profit, becomes available after confirmed delivery and the configured dispute window.</p>
    <p>Refunds, chargebacks, buyer claims, seller-caused cancellation, false cost declarations and other recoverable losses may be set off against pending or future seller settlements. Sidra provides the reason and amount inside the seller finance area.</p>
    <p>Withdrawal requests are manually paid by Sidra to the seller&apos;s verified UPI or bank destination. No automatic external bank payout is promised unless a payment provider is explicitly enabled.</p>
  </LegalPolicyPage>;
}

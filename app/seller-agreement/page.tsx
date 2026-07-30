import { LegalPolicyPage } from "@/components/legal/LegalPolicyPage";

export default function SellerAgreementPage(): React.JSX.Element {
  return <LegalPolicyPage policyId="sellerAgreement" eyebrow="Independent Studio terms" title="Seller Agreement">
    <p>Each Studio is responsible for accurate listings, lawful materials, realistic production timelines, declared product value, secure courier-ready packaging and the product matching the approved specification.</p>
    <p>Sidra may provide staged production funding only after verified buyer payment. Ready-stock orders normally receive no production advance. Made-to-order funding may be released for material cost, then making cost after evidence, while profit is released only after delivery and the configured dispute window.</p>
    <p>The platform commission is calculated on verified profit: selling subtotal after discounts, less approved product and fulfilment costs. It is not calculated on the full order value. The active plan and rate are snapshotted on the order.</p>
    <p>If a Studio defaults, submits false costing, fails to fulfil or causes a valid refund, Sidra may recover amounts from future settlements, record a negative balance, pause selected new-business features after notice, or require repayment. Existing customer support and active-order obligations remain accessible.</p>
  </LegalPolicyPage>;
}

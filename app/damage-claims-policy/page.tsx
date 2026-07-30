import { LegalPolicyPage } from "@/components/legal/LegalPolicyPage";

export default function DamageClaimsPolicyPage(): React.JSX.Element {
  return <LegalPolicyPage policyId="damageClaims" eyebrow="Evidence-led protection" title="Damage, Loss & Delivery Claims">
    <p>Inspect the parcel promptly and record a continuous unboxing video showing the sealed package, shipping label and product. Report visible damage, missing or mismatched items within 72 hours of delivery through Sidra Support, with the Air Waybill number and clear evidence.</p>
    <p>For a parcel lost or damaged inside Delhivery&apos;s network, Sidra coordinates the courier claim and keeps the buyer and Studio informed. Liability and remedy depend on courier findings, declared value, selected protection, evidence, applicable law and Sidra&apos;s seller agreement.</p>
    <p>A Studio remains responsible for incorrect goods, inadequate packaging, unlawful products or a product that materially differs from the approved specification. A buyer remains responsible for fraudulent or manipulated evidence. Sidra may hold settlement while a genuine dispute is reviewed.</p>
    <p>Proof of Delivery means the courier&apos;s delivery record. Return to Origin means an undelivered parcel returning to its pickup location. A Non-Delivery Report is a courier exception requiring an address correction, reattempt or other response.</p>
  </LegalPolicyPage>;
}

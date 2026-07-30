import type { FoundationContent } from "@/types/content";
export const foundationContent: FoundationContent = {
  navigation: [
    { id: "home", label: "Home", href: "/", enabled: true },
    { id: "studios", label: "Studios", href: "/studios", enabled: true },
    { id: "collections", label: "Collections", href: "/collections", enabled: true },
    { id: "custom", label: "Custom Orders", href: "/custom-orders", enabled: true },
    { id: "about", label: "About", href: "/about", enabled: true },
    { id: "support", label: "Support", href: "/support", enabled: true }
  ],
  footer: {
    brandLine: "A premium marketplace for handcrafted resin art, independent studios and bespoke keepsakes.",
    groups: [
      { id: "discover", title: "Discover", links: [
        { id: "studios", label: "Studios", href: "/studios" },
        { id: "collections", label: "Collections", href: "/collections" },
        { id: "custom", label: "Custom Orders", href: "/custom-orders" }
      ] },
      { id: "legal", title: "Policies", links: [
        { id: "privacy", label: "Privacy Policy", href: "/privacy" },
        { id: "terms", label: "Terms & Conditions", href: "/terms" },
        { id: "refund", label: "No-Refund Policy", href: "/no-refund-policy" },
        { id: "shipping", label: "Shipping Policy", href: "/shipping-policy" },
        { id: "cancellation", label: "Cancellation & Refund", href: "/cancellation-policy" },
        { id: "claims", label: "Damage & Claims", href: "/damage-claims-policy" },
        { id: "seller", label: "Seller Agreement", href: "/seller-agreement" },
        { id: "payout", label: "Payout & Recovery", href: "/payout-recovery-policy" }
      ] }
    ],
    legalLine: `© ${new Date().getFullYear()} Sidra. All rights reserved.`
  },
  opening: { guestLineOne: "Welcome to", guestLineTwo: "SIDRA" },
  foundation: {
    eyebrow: "SIDRA / RESIN ART MARKETPLACE",
    title: "Extraordinary resin art, discovered beautifully.",
    body: "Shop handcrafted pieces, explore verified studios and create bespoke resin keepsakes.",
    signalOne: "Curated independent studios.", signalTwo: "Made-to-order craftsmanship.", signalThree: "Founder-controlled marketplace quality."
  }
};

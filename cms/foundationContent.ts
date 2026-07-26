import type { FoundationContent } from "@/types/content";
// Boot content is isolated in one registry so Phase 10 can migrate every value to Founder CMS without component rewrites.
export const foundationContent: FoundationContent = {
  navigation: [
    { id: "home", label: "Home", href: "/", enabled: true },
    { id: "studios", label: "Studios", href: "/studios", enabled: true },
    { id: "collections", label: "Collections", href: "/collections", enabled: true },
    { id: "journal", label: "Journal", href: "/journal", enabled: true },
    { id: "custom", label: "Custom Orders", href: "/custom-orders", enabled: true },
    { id: "about", label: "About", href: "/about", enabled: true },
    { id: "support", label: "Support", href: "/support", enabled: true }
  ],
  footer: {
    brandLine: "A private digital home for extraordinary craft.",
    groups: [
      { id: "discover", title: "Discover", links: [{ id: "studios", label: "Studios", href: "/studios" }, { id: "collections", label: "Collections", href: "/collections" }] },
      { id: "sidra", title: "Sidra", links: [{ id: "about", label: "About", href: "/about" }, { id: "support", label: "Support", href: "/support" }] }
    ],
    legalLine: "Sidra. Crafted with restraint."
  },
  opening: { guestLineOne: "Welcome.", guestLineTwo: "Discover Extraordinary Craftsmanship." },
  foundation: {
    eyebrow: "SIDRA / FOUNDATION",
    title: "A quiet entrance to extraordinary craft.",
    body: "The foundation is live. Studios, collections and the private discovery experience will enter only when their production phases are verified.",
    signalOne: "Curated, never crowded.", signalTwo: "Original motion, never imitation.", signalThree: "Founder-controlled, end to end."
  }
};

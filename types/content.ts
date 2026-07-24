export interface NavigationItem { id: string; label: string; href: string; enabled: boolean; }
export interface FooterLink { id: string; label: string; href: string; }
export interface FooterGroup { id: string; title: string; links: FooterLink[]; }
export interface FooterContent { brandLine: string; groups: FooterGroup[]; legalLine: string; }
export interface FoundationContent {
  navigation: NavigationItem[];
  footer: FooterContent;
  opening: { guestLineOne: string; guestLineTwo: string };
  foundation: { eyebrow: string; title: string; body: string; signalOne: string; signalTwo: string; signalThree: string };
}

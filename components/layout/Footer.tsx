"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { foundationContent } from "@/cms/foundationContent";
import { getFooterContent } from "@/services/cmsService";
import type { FooterContent } from "@/types/content";

export function Footer(): React.JSX.Element {
  const [content, setContent] = useState<FooterContent>(foundationContent.footer);
  useEffect(() => { let active = true; getFooterContent().then((next) => { if (active) setContent(next); }).catch(() => undefined); return () => { active = false; }; }, []);
  return <footer className="border-t border-[color:rgba(213,189,159,0.2)] bg-[var(--color-deep-onyx)] px-5 py-14 text-[var(--color-porcelain)] sm:px-8"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.2fr_2fr]"><div><Link href="/" className="font-display text-4xl tracking-[0.14em]">SIDRA</Link><p className="mt-4 max-w-sm text-sm leading-7 text-white/60">{content.brandLine}</p><div className="mt-6 flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em] text-[var(--color-champagne)]"><span>Instagram</span><span>Pinterest</span><span>YouTube</span></div></div><div className="grid grid-cols-2 gap-8 sm:grid-cols-3">{content.groups.map((group) => <div key={group.id}><h2 className="text-xs uppercase tracking-[0.2em] text-[var(--color-dusty-rose)]">{group.title}</h2><ul className="mt-4 space-y-3">{group.links.map((link) => <li key={link.id}><Link href={link.href} className="text-sm text-white/60 transition hover:text-white">{link.label}</Link></li>)}</ul></div>)}</div></div><div className="mx-auto mt-12 max-w-7xl border-t border-white/10 pt-6 text-xs text-white/40">{content.legalLine}</div></footer>;
}

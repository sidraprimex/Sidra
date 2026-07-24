"use client";

import { useEffect, useState } from "react";
import { foundationContent } from "@/cms/foundationContent";
import { getFooterContent } from "@/services/cmsService";
import type { FooterContent } from "@/types/content";

export function Footer() {
  const [content, setContent] = useState<FooterContent>(foundationContent.footer);

  useEffect(() => {
    let active = true;
    getFooterContent().then((next) => {
      if (active) setContent(next);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <footer id="support" className="bg-black-950 px-4 py-9 text-ivory-100">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.4fr_2fr] md:px-2">
        <div>
          <p className="font-display text-h2">SIDRA</p>
          <p className="mt-3 max-w-sm text-caption text-gray-300">{content.brandLine}</p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {content.groups.map((group) => (
            <div key={group.id}>
              <h2 className="text-micro uppercase tracking-[0.16em] text-gold-500">{group.title}</h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.id}>
                    <a href={link.href} className="text-caption text-gray-300 transition duration-fast hover:text-ivory-100">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-ivory-100/10 pt-5 text-micro text-gray-500">
        {content.legalLine}
      </div>
    </footer>
  );
}

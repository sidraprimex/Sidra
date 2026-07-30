"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { foundationContent } from "@/cms/foundationContent";
import { getAdminDocument, setAdminDocument, toEditableRecord } from "@/services/adminOperatingService";
import type { FooterContent, NavigationItem } from "@/types/content";

export function AdminSiteChromeEditor({ actorUid }: { readonly actorUid: string }): React.JSX.Element {
  const [navigation, setNavigation] = useState<NavigationItem[]>([...foundationContent.navigation]);
  const [footer, setFooter] = useState<FooterContent>(foundationContent.footer);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    void Promise.all([getAdminDocument("cms", "navigation"), getAdminDocument("cms", "footer")]).then(([navigationDoc, footerDoc]) => {
      if (navigationDoc) {
        const value = toEditableRecord(navigationDoc.data);
        if (Array.isArray(value.items)) setNavigation(value.items as NavigationItem[]);
      }
      if (footerDoc) setFooter((current) => ({ ...current, ...(toEditableRecord(footerDoc.data) as Partial<FooterContent>) }));
    }).catch((caught) => setMessage(caught instanceof Error ? caught.message : "Menus and footer could not be loaded."));
  }, []);
  const save = async () => {
    setBusy(true); setMessage("");
    try {
      await Promise.all([
        setAdminDocument({ collectionName: "cms", documentId: "navigation", value: { items: navigation }, actorUid, action: "navigation.publish", summary: "Published navigation links" }),
        setAdminDocument({ collectionName: "cms", documentId: "footer", value: footer as unknown as Record<string, unknown>, actorUid, action: "footer.publish", summary: "Published footer links and text" }),
      ]);
      setMessage("Navigation and footer published.");
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Links could not be saved."); }
    finally { setBusy(false); }
  };
  return <section className="mb-8 rounded-[1.4rem] border border-black/10 bg-white/70 p-5">
    <p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--color-dusty-rose)]">Menus & links</p><h3 className="mt-2 font-display text-4xl text-[var(--color-deep-plum)]">Paste links—no coding</h3>
    <div className="mt-5 grid gap-3">{navigation.map((item, index) => <div key={item.id} className="grid gap-2 rounded-2xl border border-black/10 bg-white p-3 sm:grid-cols-[1fr_2fr_auto_auto]"><input value={item.label} onChange={(event) => setNavigation((current) => current.map((value, itemIndex) => itemIndex === index ? { ...value, label: event.target.value } : value))} placeholder="Menu label" className="rounded-xl border border-black/10 px-3 py-2" /><input value={item.href} onChange={(event) => setNavigation((current) => current.map((value, itemIndex) => itemIndex === index ? { ...value, href: event.target.value } : value))} placeholder="/page or https://…" className="rounded-xl border border-black/10 px-3 py-2" /><label className="flex items-center gap-2 px-2 text-xs font-semibold"><input type="checkbox" checked={item.enabled} onChange={(event) => setNavigation((current) => current.map((value, itemIndex) => itemIndex === index ? { ...value, enabled: event.target.checked } : value))} />Visible</label><button type="button" onClick={() => setNavigation((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-xl border border-rose-200 px-3 text-xs text-rose-800">Remove</button></div>)}</div>
    <Button variant="outline" className="mt-3" onClick={() => setNavigation((current) => [...current, { id: `link-${Date.now()}`, label: "New link", href: "/", enabled: true }])}>Add menu link</Button>
    <label className="mt-6 grid gap-2 text-sm font-semibold">Footer brand text<textarea value={footer.brandLine} onChange={(event) => setFooter((current) => ({ ...current, brandLine: event.target.value }))} className="min-h-20 rounded-xl border border-black/10 p-3" /></label>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">{footer.groups.map((group, groupIndex) => <div key={group.id} className="rounded-2xl border border-black/10 bg-white p-4"><input value={group.title} onChange={(event) => setFooter((current) => ({ ...current, groups: current.groups.map((value, index) => index === groupIndex ? { ...value, title: event.target.value } : value) }))} className="w-full rounded-xl border border-black/10 px-3 py-2 font-semibold" />{group.links.map((link, linkIndex) => <div key={link.id} className="mt-2 grid gap-2 sm:grid-cols-2"><input value={link.label} onChange={(event) => setFooter((current) => ({ ...current, groups: current.groups.map((value, index) => index === groupIndex ? { ...value, links: value.links.map((item, itemIndex) => itemIndex === linkIndex ? { ...item, label: event.target.value } : item) } : value) }))} className="rounded-xl border border-black/10 px-3 py-2" /><input value={link.href} onChange={(event) => setFooter((current) => ({ ...current, groups: current.groups.map((value, index) => index === groupIndex ? { ...value, links: value.links.map((item, itemIndex) => itemIndex === linkIndex ? { ...item, href: event.target.value } : item) } : value) }))} className="rounded-xl border border-black/10 px-3 py-2" /></div>)}</div>)}</div>
    {message ? <p className="mt-4 rounded-xl bg-white p-3 text-sm">{message}</p> : null}<Button className="mt-4" loading={busy} onClick={() => void save()}>Publish menus & footer</Button>
  </section>;
}

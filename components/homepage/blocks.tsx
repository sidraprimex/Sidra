import Link from "next/link";
import type { HomepageBlock } from "@/types/phase5-discovery";

function text(data: Readonly<Record<string, unknown>>, key: string, fallback = ""): string {
  return typeof data[key] === "string" ? String(data[key]) : fallback;
}
function strings(data: Readonly<Record<string, unknown>>, key: string): readonly string[] {
  return Array.isArray(data[key]) ? (data[key] as unknown[]).filter((item): item is string => typeof item === "string") : [];
}

export function HeroBlock({ block }: { readonly block: HomepageBlock }): React.JSX.Element {
  return <section className="relative flex min-h-[78svh] items-end overflow-hidden bg-[var(--color-black-950)] px-5 py-16 text-white sm:px-8 lg:px-14"><div className="mx-auto w-full max-w-7xl"><p className="text-xs uppercase tracking-[0.2em] text-[var(--color-gold-500)]">{text(block.data,"eyebrow")}</p><h1 className="mt-5 max-w-5xl font-heading text-[clamp(3.4rem,9vw,8rem)] leading-[0.86] tracking-[-0.05em]">{text(block.data,"headline")}</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-white/65">{text(block.data,"subhead")}</p><div className="mt-8 flex flex-wrap gap-3"><Link className="rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white" href={text(block.data,"primaryCtaHref","/studios")}>{text(block.data,"primaryCtaLabel","Explore")}</Link><Link className="rounded-[var(--radius-md)] border border-white/25 px-5 py-3" href={text(block.data,"secondaryCtaHref","/collections")}>{text(block.data,"secondaryCtaLabel","Collections")}</Link></div></div></section>;
}

export function EditorialBlock({ block }: { readonly block: HomepageBlock }): React.JSX.Element {
  const items = strings(block.data, "items");
  return <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">{block.type.replace(/([A-Z])/g," $1").trim()}</p><h2 className="mt-3 font-heading text-[clamp(2.4rem,6vw,4.5rem)]">{text(block.data,"title",block.type.replace(/([A-Z])/g," $1").trim())}</h2>{text(block.data,"body") ? <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{text(block.data,"body")}</p> : null}{items.length > 0 ? <div className="mt-8 grid gap-4 md:grid-cols-3">{items.map((item) => <article key={item} className="rounded-[var(--radius-lg)] border border-border bg-card p-6 font-heading text-2xl">{item}</article>)}</div> : <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-card p-10 text-muted">This CMS block is ready for live content.</div>}{text(block.data,"ctaHref") ? <Link className="mt-6 inline-flex rounded-[var(--radius-md)] border border-border px-5 py-3" href={text(block.data,"ctaHref")}>{text(block.data,"ctaLabel","Explore")}</Link> : null}</section>;
}

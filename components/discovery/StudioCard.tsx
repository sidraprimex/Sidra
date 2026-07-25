import Image from "next/image";
import Link from "next/link";
import type { PublicStudio } from "@/types/phase5-discovery";

export function StudioCard({ studio }: { readonly studio: PublicStudio }): React.JSX.Element {
  return (
    <article className="group overflow-hidden rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-card)] transition-[transform,box-shadow] duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]">
      <Link href={`/studio/${studio.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-background">
          {studio.bannerUrl ? <Image src={studio.bannerUrl} alt="" fill className="object-cover transition-transform duration-[var(--duration-slow)] group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 33vw" /> : null}
        </div>
        <div className="relative p-5 pt-12">
          <div className="absolute -top-8 left-5 size-16 overflow-hidden rounded-full border-4 border-card bg-background">
            {studio.logoUrl ? <Image src={studio.logoUrl} alt={`${studio.name} logo`} fill className="object-cover" sizes="64px" /> : null}
          </div>
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="font-heading text-2xl text-foreground">{studio.name}</h2><p className="mt-1 text-sm text-muted">{studio.location}</p></div>
            {studio.verified ? <span className="rounded-full border border-border px-3 py-1 text-xs text-[var(--color-gold-600)]">Verified</span> : null}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
            <span>{studio.rating.toFixed(1)} rating</span><span>{studio.followerCount} followers</span><span>{studio.productCount} pieces</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

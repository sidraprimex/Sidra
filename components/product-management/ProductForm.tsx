"use client";

import { useMemo, useState } from "react";
import type { ProductDraftInput, ProductMedia } from "@/types/phase4-product";
import type { TaxonomyRecord } from "@/types/phase4-taxonomy";
import { LiveFramePreview } from "@/components/product-management/LiveFramePreview";
import { validateProductDraft } from "@/utils/productValidation";

const blank: ProductDraftInput = {
  name: "",
  categoryId: "",
  categorySlug: "",
  collectionIds: [],
  shortDescription: "",
  description: "",
  story: "",
  pricePaise: 0,
  salePricePaise: null,
  sku: "",
  inventoryMode: "madeToOrder",
  inventoryCount: null,
  variants: [],
  materials: [],
  dimensions: { lengthCm: null, widthCm: null, heightCm: null },
  weightGrams: null,
  productionTimeDays: 7,
  shippingTimeDays: 5,
  seo: { title: "", description: "", keywords: [] },
};

export function ProductForm({
  initialValue = blank,
  categories,
  collections,
  media,
  saving = false,
  onSave,
  onUpload,
}: {
  readonly initialValue?: ProductDraftInput;
  readonly categories: readonly TaxonomyRecord[];
  readonly collections: readonly TaxonomyRecord[];
  readonly media: readonly ProductMedia[];
  readonly saving?: boolean;
  readonly onSave: (input: ProductDraftInput, intent: "saveDraft" | "submit") => Promise<void>;
  readonly onUpload: (files: readonly File[]) => Promise<void>;
}): React.JSX.Element {
  const [value, setValue] = useState<ProductDraftInput>(initialValue);
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});
  const preview = media.find((item) => item.kind === "image")?.url ?? null;
  const selectedCollections = useMemo(() => new Set(value.collectionIds), [value.collectionIds]);

  const submit = async (intent: "saveDraft" | "submit") => {
    const result = validateProductDraft(value, media, intent);
    setErrors(result.errors);
    if (!result.valid) return;
    await onSave(value, intent);
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form className="grid gap-8" onSubmit={(event) => event.preventDefault()}>
        <section className="grid gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-6">
          <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Basics</p><h2 className="mt-2 font-heading text-3xl">Product identity</h2></div>
          <label className="grid gap-2 text-sm">Name<input className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} />{errors.name ? <span className="text-[var(--color-error)]">{errors.name}</span> : null}</label>
          <label className="grid gap-2 text-sm">Category<select className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.categoryId} onChange={(e) => { const selected = categories.find((item) => item.id === e.target.value); setValue({ ...value, categoryId: e.target.value, categorySlug: selected?.slug ?? "" }); }}><option value="">Select category</option>{categories.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{errors.categoryId ? <span className="text-[var(--color-error)]">{errors.categoryId}</span> : null}</label>
          <fieldset className="grid gap-3"><legend className="text-sm">Collections</legend><div className="flex flex-wrap gap-3">{collections.filter((item) => item.active).map((item) => <label key={item.id} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm"><input type="checkbox" checked={selectedCollections.has(item.id)} onChange={(e) => setValue({ ...value, collectionIds: e.target.checked ? [...value.collectionIds, item.id] : value.collectionIds.filter((id) => id !== item.id) })} />{item.name}</label>)}</div></fieldset>
          <label className="grid gap-2 text-sm">Short description<textarea className="min-h-24 rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.shortDescription} onChange={(e) => setValue({ ...value, shortDescription: e.target.value })} /></label>
          <label className="grid gap-2 text-sm">Full description<textarea className="min-h-40 rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.description} onChange={(e) => setValue({ ...value, description: e.target.value })} /></label>
          <label className="grid gap-2 text-sm">Craft story<textarea className="min-h-32 rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.story} onChange={(e) => setValue({ ...value, story: e.target.value })} /></label>
        </section>

        <section className="grid gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-6">
          <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Media</p><h2 className="mt-2 font-heading text-3xl">Photography</h2></div>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => void onUpload(Array.from(e.target.files ?? []))} />
          {errors.media ? <p className="text-sm text-[var(--color-error)]">{errors.media}</p> : null}
        </section>

        <section className="grid gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-6">
          <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Pricing & Inventory</p><h2 className="mt-2 font-heading text-3xl">Commercial details</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">Price (INR)<input type="number" min="1" className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.pricePaise / 100 || ""} onChange={(e) => setValue({ ...value, pricePaise: Math.round(Number(e.target.value) * 100) })} /></label>
            <label className="grid gap-2 text-sm">Sale price (INR)<input type="number" min="0" className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.salePricePaise === null ? "" : value.salePricePaise / 100} onChange={(e) => setValue({ ...value, salePricePaise: e.target.value ? Math.round(Number(e.target.value) * 100) : null })} /></label>
            <label className="grid gap-2 text-sm">SKU<input className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.sku} onChange={(e) => setValue({ ...value, sku: e.target.value })} /></label>
            <label className="grid gap-2 text-sm">Inventory mode<select className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.inventoryMode} onChange={(e) => setValue({ ...value, inventoryMode: e.target.value as ProductDraftInput["inventoryMode"] })}><option value="madeToOrder">Made to order</option><option value="finite">Finite</option><option value="unlimited">Unlimited</option></select></label>
          </div>
        </section>

        <section className="grid gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-6">
          <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Specs & SEO</p><h2 className="mt-2 font-heading text-3xl">Craft and discovery details</h2></div>
          <label className="grid gap-2 text-sm">Materials, comma separated<input className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.materials.join(", ")} onChange={(e) => setValue({ ...value, materials: e.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
          <label className="grid gap-2 text-sm">SEO title<input className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.seo.title} onChange={(e) => setValue({ ...value, seo: { ...value.seo, title: e.target.value } })} /></label>
          <label className="grid gap-2 text-sm">SEO description<textarea className="min-h-24 rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.seo.description} onChange={(e) => setValue({ ...value, seo: { ...value.seo, description: e.target.value } })} /></label>
        </section>

        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={saving} className="rounded-[var(--radius-md)] border border-border px-5 py-3" onClick={() => void submit("saveDraft")}>Save draft</button>
          <button type="button" disabled={saving} className="rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white" onClick={() => void submit("submit")}>Submit product</button>
        </div>
      </form>
      <aside className="xl:sticky xl:top-24 xl:self-start"><LiveFramePreview categorySlug={value.categorySlug} imageUrl={preview} /></aside>
    </div>
  );
}

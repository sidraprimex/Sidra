"use client";

import { useMemo, useState } from "react";
import type { ProductDraftInput, ProductMedia } from "@/types/phase4-product";
import type { TaxonomyRecord } from "@/types/phase4-taxonomy";
import { LiveFramePreview } from "@/components/product-management/LiveFramePreview";
import { validateProductDraft } from "@/utils/productValidation";
import Link from "next/link";
import { calculateProfitCommission } from "@/utils/subscriptionCommission";
import type { SellerSubscriptionPlan } from "@/types/seller-subscription";

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
  costing: {
    makingCostPaise: 0,
    sellerShippingCostPaise: 0,
  },
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
  subscriptionPlan = "free",
  commissionBasisPoints = 1200,
  planLabel = "Free",
  onSave,
  onUpload,
}: {
  readonly initialValue?: ProductDraftInput;
  readonly categories: readonly TaxonomyRecord[];
  readonly collections: readonly TaxonomyRecord[];
  readonly media: readonly ProductMedia[];
  readonly saving?: boolean;
  readonly subscriptionPlan?: SellerSubscriptionPlan;
  readonly commissionBasisPoints?: number;
  readonly planLabel?: string;
  readonly onSave: (input: ProductDraftInput, intent: "saveDraft" | "submit") => Promise<void>;
  readonly onUpload: (files: readonly File[], input: ProductDraftInput) => Promise<void>;
}): React.JSX.Element {
  const [value, setValue] = useState<ProductDraftInput>(initialValue);
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const preview = media.find((item) => item.kind === "image")?.url ?? null;
  const selectedCollections = useMemo(() => new Set(value.collectionIds), [value.collectionIds]);
  const currentCosting = value.costing ?? {
    makingCostPaise: 0,
    sellerShippingCostPaise: 0,
  };
  const sellingPrice = value.salePricePaise ?? value.pricePaise;
  const estimate = calculateProfitCommission({ sellingSubtotalPaise: sellingPrice, sellerCostPaise: currentCosting.makingCostPaise, plan: subscriptionPlan, configuredBasisPoints: commissionBasisPoints });
  const originalOfferPrice = value.salePricePaise === null ? null : value.pricePaise;
  const setSellingPrice = (paise: number) => setValue({ ...value, pricePaise: value.salePricePaise === null ? paise : value.pricePaise, salePricePaise: value.salePricePaise === null ? null : paise, costing: { ...currentCosting, sellerShippingCostPaise: 0 } });
  const setOriginalOfferPrice = (raw: string) => {
    if (!raw) { setValue({ ...value, pricePaise: sellingPrice, salePricePaise: null }); return; }
    const original = Math.round(Number(raw) * 100);
    setValue({ ...value, pricePaise: original, salePricePaise: sellingPrice });
  };

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
          <label className="grid gap-2 text-sm">Product name <span className="text-xs text-muted">Example: Rehaal Islamic Resin Wall Art</span><input placeholder="Rehaal Islamic Resin Wall Art" className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} />{errors.name ? <span className="text-[var(--color-error)]">{errors.name}</span> : null}</label>
          <label className="grid gap-2 text-sm">Category <span className="text-xs text-muted">Choose the closest type so buyers can discover this product.</span><select className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.categoryId} onChange={(e) => { const selected = categories.find((item) => item.id === e.target.value); setValue({ ...value, categoryId: e.target.value, categorySlug: selected?.slug ?? "" }); }}><option value="">Select category</option>{categories.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{errors.categoryId ? <span className="text-[var(--color-error)]">{errors.categoryId}</span> : null}</label>
          <fieldset className="grid gap-3"><legend className="text-sm">Collections</legend><div className="flex flex-wrap gap-3">{collections.filter((item) => item.active).map((item) => <label key={item.id} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm"><input type="checkbox" checked={selectedCollections.has(item.id)} onChange={(e) => setValue({ ...value, collectionIds: e.target.checked ? [...value.collectionIds, item.id] : value.collectionIds.filter((id) => id !== item.id) })} />{item.name}</label>)}</div>{collections.length === 0 ? <p className="text-sm text-muted">Create your first collection in <Link href="/studio-admin/storefront" className="font-semibold underline">Customize store</Link>, then return here.</p> : <Link href="/studio-admin/storefront" className="w-fit text-xs font-semibold text-[var(--color-gold-600)] underline">Manage Studio collections</Link>}</fieldset>
          <label className="grid gap-2 text-sm">Short description <span className="text-xs text-muted">Example: Handmade Islamic wall art in premium resin with gold detailing.</span><textarea placeholder="One clear sentence about the product" className="min-h-24 rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.shortDescription} onChange={(e) => setValue({ ...value, shortDescription: e.target.value })} />{errors.shortDescription ? <span className="text-[var(--color-error)]">{errors.shortDescription}</span> : null}</label>
          <label className="grid gap-2 text-sm">Full description <span className="text-xs text-muted">Mention size, finish, use, care instructions and what the buyer receives.</span><textarea placeholder="Example: This handcrafted 18-inch wall piece..." className="min-h-40 rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.description} onChange={(e) => setValue({ ...value, description: e.target.value })} />{errors.description ? <span className="text-[var(--color-error)]">{errors.description}</span> : null}</label>
          <label className="grid gap-2 text-sm">Craft story (optional) <span className="text-xs text-muted">Tell buyers what inspired the design or how it was made.</span><textarea placeholder="Example: Inspired by traditional Islamic geometry..." className="min-h-32 rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.story} onChange={(e) => setValue({ ...value, story: e.target.value })} /></label>
        </section>

        <section className="grid gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-6">
          <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Media</p><h2 className="mt-2 font-heading text-3xl">Photography</h2></div>
          <p className="text-sm text-muted">Upload clear front, side and detail photos. Selecting files automatically saves a private draft first.</p>
          <input disabled={uploading} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={async (e) => { const files=Array.from(e.target.files ?? []); if(files.length===0)return; setUploading(true);setUploadError(null);try{await onUpload(files,{...value,costing:{...currentCosting,sellerShippingCostPaise:0}});setErrors((current)=>Object.fromEntries(Object.entries(current).filter(([key])=>key!=="media")));}catch(caught){setUploadError(caught instanceof Error?caught.message:"Images could not be uploaded.");}finally{setUploading(false);} }} />
          {uploading ? <p className="text-sm font-semibold text-[var(--color-gold-600)]">Uploading and securing images…</p> : <p className="text-sm text-muted">{media.length} image{media.length===1?"":"s"} uploaded</p>}
          {uploadError || errors.media ? <p className="text-sm text-[var(--color-error)]">{uploadError ?? errors.media}</p> : null}
        </section>

        <section className="grid gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-6">
          <div><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Pricing & Inventory</p><h2 className="mt-2 font-heading text-3xl">Commercial details</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">Customer selling price (INR) <span className="text-xs text-muted">Example: ₹20,000 — this is what the buyer sees and pays.</span><input type="number" min="1" placeholder="20000" className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={sellingPrice / 100 || ""} onChange={(e) => setSellingPrice(Math.round(Number(e.target.value)*100))} />{errors.pricePaise ? <span className="text-[var(--color-error)]">{errors.pricePaise}</span> : null}</label>
            <label className="grid gap-2 text-sm">Original price before discount (optional) <span className="text-xs text-muted">Example: ₹25,000 will appear crossed out beside ₹20,000.</span><input type="number" min="1" placeholder="25000" className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={originalOfferPrice===null?"":originalOfferPrice/100} onChange={(e)=>setOriginalOfferPrice(e.target.value)} />{errors.salePricePaise ? <span className="text-[var(--color-error)]">Original price must be higher than the selling price.</span> : null}</label>
            <label className="grid gap-2 text-sm">Private product cost (INR) <span className="text-xs text-muted">Example: ₹6,000 total resin, material and making cost. Buyers never see this.</span><input type="number" min="0" placeholder="6000" className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={currentCosting.makingCostPaise/100||""} onChange={(e)=>setValue({...value,costing:{makingCostPaise:Math.max(0,Math.round(Number(e.target.value)*100)),sellerShippingCostPaise:0}})} />{errors.makingCostPaise ? <span className="text-[var(--color-error)]">{errors.makingCostPaise}</span> : null}</label>
            <label className="grid gap-2 text-sm">SKU (optional) <span className="text-xs text-muted">Example: REHAAL-GOLD-01 for your own inventory tracking.</span><input placeholder="REHAAL-GOLD-01" className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.sku} onChange={(e) => setValue({ ...value, sku: e.target.value })} /></label>
            <label className="grid gap-2 text-sm">Inventory mode<select className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" value={value.inventoryMode} onChange={(e) => setValue({ ...value, inventoryMode: e.target.value as ProductDraftInput["inventoryMode"] })}><option value="madeToOrder">Made to order</option><option value="finite">Finite</option><option value="unlimited">Unlimited</option></select></label>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-gold-600)]/25 bg-[var(--color-gold-100)]/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--color-gold-600)]">Private seller estimate</p>
            <p className="mt-2 font-heading text-3xl">₹{(estimate.sellerProfitAfterCommissionPaise/100).toLocaleString("en-IN")} expected seller profit</p>
            <div className="mt-4 grid gap-2 text-sm"><p className="flex justify-between"><span>Customer selling price</span><strong>₹{(sellingPrice/100).toLocaleString("en-IN")}</strong></p><p className="flex justify-between"><span>Private product cost</span><strong>− ₹{(currentCosting.makingCostPaise/100).toLocaleString("en-IN")}</strong></p><p className="flex justify-between"><span>Gross profit</span><strong>₹{(estimate.profitPaise/100).toLocaleString("en-IN")}</strong></p><p className="flex justify-between"><span>Estimated Sidra commission ({(estimate.commissionBasisPoints/100).toFixed(2)}% · {planLabel})</span><strong>− ₹{(estimate.commissionPaise/100).toLocaleString("en-IN")}</strong></p></div>
            <p className="mt-4 text-xs leading-6 text-muted">Shipping is included in the product price and handled by Sidra—not entered by the seller. The actual Delhivery charge depends on the buyer address and parcel, so final settlement adjusts that verified charge automatically.</p>
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

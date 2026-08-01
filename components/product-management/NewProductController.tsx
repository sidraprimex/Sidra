"use client";

import { useEffect, useState } from "react";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { ProductForm } from "@/components/product-management/ProductForm";
import { createProductDraft, getProductDraftForEdit, submitProduct, updateProductDraft, uploadProductImages } from "@/services/productManagementService";
import { listTaxonomy } from "@/services/taxonomyManagementService";
import { getStudioStorefront } from "@/services/studioStorefrontService";
import type { ProductDraftInput, ProductMedia } from "@/types/phase4-product";
import type { TaxonomyRecord } from "@/types/phase4-taxonomy";

export function NewProductController({ existingProductId }: { readonly existingProductId?: string }): React.JSX.Element {
  const auth = useRouteGuard({ allowedRoles: ["seller", "founder", "superAdmin"], requireStudioId: true });
  const [categories, setCategories] = useState<readonly TaxonomyRecord[]>([]);
  const [collections, setCollections] = useState<readonly TaxonomyRecord[]>([]);
  const [media, setMedia] = useState<readonly ProductMedia[]>([]);
  const [productId, setProductId] = useState<string | null>(existingProductId ?? null);
  const [initialValue, setInitialValue] = useState<ProductDraftInput | null>(null);
  const [loading, setLoading] = useState(Boolean(existingProductId));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (!auth.claims?.studioId) return; void Promise.all([listTaxonomy("categories"), listTaxonomy("collections"), getStudioStorefront(auth.claims.studioId), existingProductId ? getProductDraftForEdit(existingProductId) : Promise.resolve(null)]).then(([nextCategories, globalCollections, storefront, draft]) => { const studioCollections: TaxonomyRecord[] = storefront.collections.map((item) => ({ id:item.id,name:item.name,slug:item.id,description:item.description,imageUrl:null,active:item.enabled,sortOrder:item.sortOrder,createdAt:"",updatedAt:"" })); setCategories(nextCategories); setCollections([...studioCollections,...globalCollections.filter((item)=>!studioCollections.some((own)=>own.id===item.id))]); if(existingProductId){if(!draft)throw new Error("Product not found or you do not have access.");setInitialValue(draft.input);setMedia(draft.media);}}).catch((caught)=>setError(caught instanceof Error?caught.message:"Product editor could not be loaded.")).finally(()=>setLoading(false)); }, [auth.claims?.studioId, existingProductId]);
  const ensure = async (input: ProductDraftInput) => {
    if (!auth.user || !auth.claims?.studioId) throw new Error("Your verified Studio connection is required.");
    return productId ?? createProductDraft(auth.claims.studioId, auth.user.uid, input).then((id) => { setProductId(id); return id; });
  };
  if(auth.loading||loading)return <p className="py-16 text-center text-sm text-muted">Preparing product editor…</p>; if(error)return <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</p>;
  return <ProductForm initialValue={initialValue ?? undefined} categories={categories} collections={collections} media={media} saving={saving} onUpload={async (files) => { if (!productId) throw new Error("Save the product basics before uploading media."); if (!auth.claims?.studioId) throw new Error("Your verified Studio connection is required."); setMedia(await uploadProductImages(auth.claims.studioId, productId, files)); }} onSave={async (input, intent) => { setSaving(true); try { const existingId = productId; const id = await ensure(input); if (existingId) await updateProductDraft(id, input); if (intent === "submit") await submitProduct(id); } finally { setSaving(false); } }} />;
}

"use client";

import { useEffect, useState } from "react";
import { ProductForm } from "@/components/product-management/ProductForm";
import { createProductDraft, submitProduct, uploadProductImages } from "@/services/productManagementService";
import { listTaxonomy } from "@/services/taxonomyManagementService";
import type { ProductDraftInput, ProductMedia } from "@/types/phase4-product";
import type { TaxonomyRecord } from "@/types/phase4-taxonomy";

export function NewProductController(): React.JSX.Element {
  const [categories, setCategories] = useState<readonly TaxonomyRecord[]>([]);
  const [collections, setCollections] = useState<readonly TaxonomyRecord[]>([]);
  const [media, setMedia] = useState<readonly ProductMedia[]>([]);
  const [productId, setProductId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { void Promise.all([listTaxonomy("categories"), listTaxonomy("collections")]).then(([a, b]) => { setCategories(a); setCollections(b); }); }, []);
  const ensure = async (input: ProductDraftInput) => productId ?? createProductDraft("current-studio", "current-seller", input).then((id) => { setProductId(id); return id; });
  return <ProductForm categories={categories} collections={collections} media={media} saving={saving} onUpload={async (files) => { if (!productId) throw new Error("Save the product basics before uploading media."); setMedia(await uploadProductImages("current-studio", productId, files)); }} onSave={async (input, intent) => { setSaving(true); try { const id = await ensure(input); if (intent === "submit") await submitProduct(id); } finally { setSaving(false); } }} />;
}

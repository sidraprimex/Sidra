"use client";

import { useEffect, useState } from "react";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { ProductForm } from "@/components/product-management/ProductForm";
import { createProductDraft, submitProduct, updateProductDraft, uploadProductImages } from "@/services/productManagementService";
import { listTaxonomy } from "@/services/taxonomyManagementService";
import type { ProductDraftInput, ProductMedia } from "@/types/phase4-product";
import type { TaxonomyRecord } from "@/types/phase4-taxonomy";

export function NewProductController(): React.JSX.Element {
  const auth = useRouteGuard({ allowedRoles: ["seller", "founder", "superAdmin"], requireStudioId: true });
  const [categories, setCategories] = useState<readonly TaxonomyRecord[]>([]);
  const [collections, setCollections] = useState<readonly TaxonomyRecord[]>([]);
  const [media, setMedia] = useState<readonly ProductMedia[]>([]);
  const [productId, setProductId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { void Promise.all([listTaxonomy("categories"), listTaxonomy("collections")]).then(([a, b]) => { setCategories(a); setCollections(b); }); }, []);
  const ensure = async (input: ProductDraftInput) => {
    if (!auth.user || !auth.claims?.studioId) throw new Error("Your verified Studio connection is required.");
    return productId ?? createProductDraft(auth.claims.studioId, auth.user.uid, input).then((id) => { setProductId(id); return id; });
  };
  return <ProductForm categories={categories} collections={collections} media={media} saving={saving} onUpload={async (files) => { if (!productId) throw new Error("Save the product basics before uploading media."); if (!auth.claims?.studioId) throw new Error("Your verified Studio connection is required."); setMedia(await uploadProductImages(auth.claims.studioId, productId, files)); }} onSave={async (input, intent) => { setSaving(true); try { const existingId = productId; const id = await ensure(input); if (existingId) await updateProductDraft(id, input); if (intent === "submit") await submitProduct(id); } finally { setSaving(false); } }} />;
}

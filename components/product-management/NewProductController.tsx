"use client";

import { useEffect, useState } from "react";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { ProductForm } from "@/components/product-management/ProductForm";
import {
  createProductDraft,
  getProductDraftForEdit,
  submitProduct,
  updateProductDraft,
  uploadProductImages,
} from "@/services/productManagementService";
import { listTaxonomy } from "@/services/taxonomyManagementService";
import { getStudioStorefront } from "@/services/studioStorefrontService";
import { getSellerStudio } from "@/services/studioStorefrontService";
import { getSellerCommerceSettings } from "@/services/businessConfigurationService";
import {
  SELLER_PLANS,
  type SellerSubscriptionPlan,
} from "@/types/seller-subscription";
import type { ProductDraftInput, ProductMedia } from "@/types/phase4-product";
import type { TaxonomyRecord } from "@/types/phase4-taxonomy";

const fallbackCategories: readonly TaxonomyRecord[] = [
  ["wall-art", "Wall Art"],
  ["islamic-art", "Islamic Art"],
  ["tables", "Resin Tables"],
  ["clocks", "Resin Clocks"],
  ["trays", "Trays & Serveware"],
  ["home-decor", "Home Decor"],
  ["jewellery", "Resin Jewellery"],
  ["gifts", "Personalised Gifts"],
].map(([id, name], sortOrder) => ({
  id,
  name,
  slug: id,
  description: "",
  imageUrl: null,
  active: true,
  sortOrder,
  createdAt: "",
  updatedAt: "",
}));

export function NewProductController({
  existingProductId,
}: {
  readonly existingProductId?: string;
}): React.JSX.Element {
  const auth = useRouteGuard({
    allowedRoles: ["seller", "founder", "superAdmin"],
    requireStudioId: true,
  });
  const [categories, setCategories] = useState<readonly TaxonomyRecord[]>([]);
  const [collections, setCollections] = useState<readonly TaxonomyRecord[]>([]);
  const [media, setMedia] = useState<readonly ProductMedia[]>([]);
  const [productId, setProductId] = useState<string | null>(
    existingProductId ?? null,
  );
  const [initialValue, setInitialValue] = useState<ProductDraftInput | null>(
    null,
  );
  const [loading, setLoading] = useState(Boolean(existingProductId));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<SellerSubscriptionPlan>("free");
  const [commissionBasisPoints, setCommissionBasisPoints] = useState(1200);
  const [planLabel, setPlanLabel] = useState("Free");
  useEffect(() => {
    if (!auth.claims?.studioId) return;
    void Promise.all([
      listTaxonomy("categories"),
      listTaxonomy("collections"),
      getStudioStorefront(auth.claims.studioId),
      getSellerStudio(auth.claims.studioId),
      getSellerCommerceSettings(),
      existingProductId
        ? getProductDraftForEdit(existingProductId)
        : Promise.resolve(null),
    ])
      .then(
        ([
          nextCategories,
          globalCollections,
          storefront,
          studio,
          commerce,
          draft,
        ]) => {
          const studioCollections: TaxonomyRecord[] =
            storefront.collections.map((item) => ({
              id: item.id,
              name: item.name,
              slug: item.id,
              description: item.description,
              imageUrl: null,
              active: item.enabled,
              sortOrder: item.sortOrder,
              createdAt: "",
              updatedAt: "",
            }));
          setCategories(
            nextCategories.some((item) => item.active)
              ? nextCategories
              : fallbackCategories,
          );
          setCollections([
            ...studioCollections,
            ...globalCollections.filter(
              (item) => !studioCollections.some((own) => own.id === item.id),
            ),
          ]);
          const rawStudio = studio as typeof studio & {
            subscriptionPlan?: SellerSubscriptionPlan;
            commissionRateBasisPoints?: number;
          };
          const nextPlan =
            rawStudio?.subscriptionPlan &&
            SELLER_PLANS[rawStudio.subscriptionPlan]
              ? rawStudio.subscriptionPlan
              : "free";
          const definition = commerce.plans.find(
            (item) => item.id === nextPlan,
          );
          setPlan(nextPlan);
          setCommissionBasisPoints(
            Number(
              rawStudio?.commissionRateBasisPoints ??
                definition?.commissionBasisPoints ??
                SELLER_PLANS[nextPlan].maximumCommissionBasisPoints,
            ),
          );
          setPlanLabel(definition?.label ?? SELLER_PLANS[nextPlan].label);
          if (existingProductId) {
            if (!draft)
              throw new Error("Product not found or you do not have access.");
            setInitialValue({
              ...draft.input,
              costing: {
                makingCostPaise: draft.input.costing?.makingCostPaise ?? 0,
                sellerShippingCostPaise: 0,
              },
            });
            setMedia(draft.media);
          }
        },
      )
      .catch((caught) =>
        setError(
          caught instanceof Error
            ? caught.message
            : "Product editor could not be loaded.",
        ),
      )
      .finally(() => setLoading(false));
  }, [auth.claims?.studioId, existingProductId]);
  const ensure = async (input: ProductDraftInput) => {
    if (!auth.user || !auth.claims?.studioId)
      throw new Error("Your verified Studio connection is required.");
    return (
      productId ??
      createProductDraft(auth.claims.studioId, auth.user.uid, input).then(
        (id) => {
          setProductId(id);
          return id;
        },
      )
    );
  };
  if (auth.loading || loading)
    return (
      <p className="py-16 text-center text-sm text-muted">
        Preparing product editor…
      </p>
    );
  if (error)
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        {error}
      </p>
    );
  return (
    <ProductForm
      initialValue={initialValue ?? undefined}
      draftStorageKey={auth.user ? `sidra-product-draft-${auth.user.uid}-${existingProductId ?? "new"}` : undefined}
      categories={categories}
      collections={collections}
      media={media}
      saving={saving}
      subscriptionPlan={plan}
      commissionBasisPoints={commissionBasisPoints}
      planLabel={planLabel}
      onUpload={async (files, input) => {
        if (!auth.claims?.studioId)
          throw new Error("Your verified Studio connection is required.");
        const safeInput = {
          ...input,
          costing: {
            makingCostPaise: input.costing?.makingCostPaise ?? 0,
            sellerShippingCostPaise: 0,
          },
        };
        const existed = Boolean(productId);
        const id = await ensure(safeInput);
        if (existed) await updateProductDraft(id, safeInput);
        setMedia(await uploadProductImages(auth.claims.studioId, id, files));
      }}
      onSave={async (input, intent) => {
        setSaving(true);
        try {
          const safeInput = {
            ...input,
            costing: {
              makingCostPaise: input.costing?.makingCostPaise ?? 0,
              sellerShippingCostPaise: 0,
            },
          };
          const existingId = productId;
          const id = await ensure(safeInput);
          if (existingId) await updateProductDraft(id, safeInput);
          if (intent === "submit") await submitProduct(id);
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}

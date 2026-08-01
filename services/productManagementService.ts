import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import { uploadB2Media } from "@/services/b2MediaService";
import { getProductModerationSettings } from "@/services/productModerationService";
import type {
  ProductDraftInput,
  ProductMedia,
  ProductStatus,
  StudioProduct,
} from "@/types/phase4-product";
import { normalizeSlug, validateProductDraft } from "@/utils/productValidation";
import { compressProductImage } from "@/utils/imageCompression";

export async function listStudioProducts(studioId: string): Promise<readonly StudioProduct[]> {
  const snapshot = await getDocs(
    query(
      collection(phase4Firestore(), "products"),
      where("studioId", "==", studioId),
      orderBy("updatedAt", "desc"),
      limit(100),
    ),
  );
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as StudioProduct);
}

export async function getStudioProduct(productId: string): Promise<StudioProduct | null> {
  const snapshot = await getDoc(doc(phase4Firestore(), "products", productId));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as StudioProduct) : null;
}
export async function getProductDraftForEdit(productId: string): Promise<{ readonly input: ProductDraftInput; readonly media: readonly ProductMedia[] } | null> {
  const product = await getStudioProduct(productId); if (!product) return null;
  const costingSnapshot = await getDoc(doc(phase4Firestore(), "productCostings", productId)); const costing = costingSnapshot.data() ?? {};
  return { media: product.media ?? [], input: { name: product.name, categoryId: product.categoryId, categorySlug: product.categorySlug, collectionIds: product.collectionIds ?? [], shortDescription: product.shortDescription ?? "", description: product.description ?? "", story: product.story ?? "", pricePaise: product.pricePaise, salePricePaise: product.salePricePaise, costing: { makingCostPaise: Number(costing.makingCostPaise ?? 0), sellerShippingCostPaise: Number(costing.sellerShippingCostPaise ?? 0) }, sku: product.sku ?? "", inventoryMode: product.inventoryMode, inventoryCount: product.inventoryCount, variants: product.variants ?? [], materials: product.materials ?? [], dimensions: product.dimensions, weightGrams: product.weightGrams, productionTimeDays: product.productionTimeDays, shippingTimeDays: product.shippingTimeDays, seo: product.seo } };
}

export async function createProductDraft(
  studioId: string,
  sellerId: string,
  input: ProductDraftInput,
): Promise<string> {
  const validation = validateProductDraft(input, [], "saveDraft");
  if (!validation.valid) throw new Error(Object.values(validation.errors)[0]);
  const db = phase4Firestore();
  const reference = doc(collection(db, "products"));
  const {
    costing = { makingCostPaise: 0, sellerShippingCostPaise: 0 },
    ...publicInput
  } = input;
  const batch = writeBatch(db);
  batch.set(reference, {
    ...publicInput,
    productId: reference.id,
    studioId,
    sellerId,
    slug: `${normalizeSlug(input.name)}-${Date.now().toString(36)}`,
    media: [],
    heroImageUrl: null,
    generatedVideoUrl: null,
    status: "draft" satisfies ProductStatus,
    submittedAt: null,
    approvedAt: null,
    publishedAt: null,
    archivedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, "productCostings", reference.id), {
    productId: reference.id,
    studioId,
    sellerId,
    ...costing,
    sellerShippingCostPaise: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return reference.id;
}

export async function updateProductDraft(productId: string, input: ProductDraftInput): Promise<void> {
  const existing = await getStudioProduct(productId);
  if (!existing) throw new Error("Product not found.");
  const validation = validateProductDraft(input, existing.media, "saveDraft");
  if (!validation.valid) throw new Error(Object.values(validation.errors)[0]);
  const db = phase4Firestore();
  const {
    costing = { makingCostPaise: 0, sellerShippingCostPaise: 0 },
    ...publicInput
  } = input;
  const batch = writeBatch(db);
  batch.update(doc(db, "products", productId), { ...publicInput, updatedAt: serverTimestamp() });
  batch.set(doc(db, "productCostings", productId), {
    productId,
    studioId: existing.studioId,
    sellerId: existing.sellerId,
    ...costing,
    sellerShippingCostPaise: 0,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await batch.commit();
}

export async function uploadProductImages(
  studioId: string,
  productId: string,
  files: readonly File[],
): Promise<readonly ProductMedia[]> {
  const uploaded: ProductMedia[] = [];
  for (const [index, file] of files.entries()) {
    const processed = await compressProductImage(file);
    const safeName = `${Date.now()}-${index}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const [optimizedResult, originalResult] = await Promise.all([
      uploadB2Media({
        file: processed.optimized,
        fileName: safeName.replace(/\.[^.]+$/, ".jpg"),
        context: "product",
        studioId,
        productId,
      }),
      uploadB2Media({
        file: processed.original,
        fileName: safeName,
        context: "product",
        studioId,
        productId,
      }),
    ]);
    uploaded.push({
      id: crypto.randomUUID(),
      kind: "image",
      url: optimizedResult.publicUrl,
      storagePath: optimizedResult.path,
      originalUrl: originalResult.publicUrl,
      originalStoragePath: originalResult.path,
      width: processed.width,
      height: processed.height,
      alt: "",
      sortOrder: index,
    });
  }
  const existing = await getStudioProduct(productId);
  const media = [...(existing?.media ?? []), ...uploaded];
  await updateDoc(doc(phase4Firestore(), "products", productId), { media, updatedAt: serverTimestamp() });
  return media;
}

export async function submitProduct(productId: string): Promise<ProductStatus> {
  const existing = await getStudioProduct(productId);
  if (!existing) throw new Error("Product not found.");
  const costingSnapshot = await getDoc(doc(phase4Firestore(), "productCostings", productId));
  const costing = costingSnapshot.data() ?? {};
  const validation = validateProductDraft({
    ...existing,
    costing: {
      makingCostPaise: Number(costing.makingCostPaise ?? 0),
      sellerShippingCostPaise: 0,
    },
  }, existing.media, "submit");
  if (!validation.valid) throw new Error(Object.values(validation.errors)[0]);
  const settings = await getProductModerationSettings();
  const status: ProductStatus = settings.approvalRequired ? "pendingReview" : "published";
  await updateDoc(doc(phase4Firestore(), "products", productId), {
    status,
    submittedAt: serverTimestamp(),
    publishedAt: status === "published" ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
  return status;
}

export async function archiveProduct(productId: string): Promise<void> {
  await updateDoc(doc(phase4Firestore(), "products", productId), {
    status: "archived",
    archivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function duplicateProduct(productId: string): Promise<string> {
  const existing = await getStudioProduct(productId);
  if (!existing) throw new Error("Product not found.");
  const reference = doc(collection(phase4Firestore(), "products"));
  const copy = Object.fromEntries(
    Object.entries(existing).filter(
      ([key]) => !["id", "media", "sku", "slug"].includes(key),
    ),
  );
  await setDoc(reference, {
    ...copy,
    name: `${existing.name} Copy`,
    slug: `${normalizeSlug(existing.name)}-copy-${Date.now().toString(36)}`,
    sku: "",
    media: [],
    heroImageUrl: null,
    generatedVideoUrl: null,
    status: "draft",
    submittedAt: null,
    approvedAt: null,
    publishedAt: null,
    archivedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

import { where } from "firebase/firestore";
import { getDocumentById, listDocuments, setDocument } from "@/services/firestoreRepository";
import type { MediaAsset } from "@/types/marketing";

export function getMediaAsset(mediaId: string): Promise<MediaAsset | null> {
  return getDocumentById<MediaAsset>("media", mediaId);
}

export function listOwnerMedia(ownerType: MediaAsset["ownerType"], ownerId: string, maxResults = 100): Promise<readonly MediaAsset[]> {
  return listDocuments<MediaAsset>("media", [where("ownerType", "==", ownerType), where("ownerId", "==", ownerId)], maxResults);
}

export function registerMediaAsset(asset: MediaAsset): Promise<void> {
  return setDocument("media", asset.mediaId, asset);
}

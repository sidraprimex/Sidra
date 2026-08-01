import { requireFirebaseServices } from "@/services/firebaseClient";

interface UploadResult {
  readonly path: string;
  readonly publicUrl: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly size: number;
}

export async function uploadB2Media(input: {
  readonly file: File | Blob;
  readonly fileName: string;
  readonly context: "profile" | "product" | "studio-branding";
  readonly studioId?: string;
  readonly productId?: string;
}): Promise<UploadResult> {
  const user = requireFirebaseServices().auth.currentUser;
  if (!user) throw new Error("Sign in again before uploading media.");
  const body = new FormData();
  body.set("file", input.file, input.fileName);
  body.set("ownerUid", user.uid);
  body.set("context", input.context);
  if (input.studioId) body.set("studioId", input.studioId);
  if (input.productId) body.set("productId", input.productId);
  const response = await fetch("/api/media/b2/upload", {
    method: "POST",
    headers: { authorization: `Bearer ${await user.getIdToken(true)}` },
    body,
  });
  const payload = (await response.json().catch(() => null)) as (UploadResult & { error?: string }) | null;
  if (!response.ok || !payload) throw new Error(payload?.error || "Media upload failed.");
  return payload;
}

import { NextResponse } from "next/server";
import { verifyFirebaseRequest } from "@/lib/server/firebaseIdentity";
import {
  getTelegramFile,
  telegramFileDownloadUrl,
} from "@/lib/server/telegramBot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ADMIN_EMAIL = "syedafsharkhadri63@gmail.com";

function safeMime(value: string | null): string {
  const mime = value?.trim() || "application/octet-stream";

  return /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(mime)
    ? mime
    : "application/octet-stream";
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const identity = await verifyFirebaseRequest(request);
    const url = new URL(request.url);
    const fileId = url.searchParams.get("fileId")?.trim() ?? "";
    const ownerUid = url.searchParams.get("ownerUid")?.trim() ?? "";
    const mimeType = safeMime(url.searchParams.get("mimeType"));

    const isAdmin =
      identity.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (!fileId || !ownerUid) {
      return NextResponse.json(
        { error: "File reference is incomplete." },
        { status: 400 },
      );
    }

    if (identity.uid !== ownerUid && !isAdmin) {
      return NextResponse.json(
        { error: "You cannot access this seller file." },
        { status: 403 },
      );
    }

    const telegramFile = await getTelegramFile(fileId);

    if (!telegramFile.file_path) {
      throw new Error("Telegram file path is unavailable.");
    }

    const fileResponse = await fetch(
      telegramFileDownloadUrl(telegramFile.file_path),
      { cache: "no-store" },
    );

    if (!fileResponse.ok) {
      throw new Error("Telegram file download failed.");
    }

    return new NextResponse(await fileResponse.arrayBuffer(), {
      status: 200,
      headers: {
        "content-type": mimeType,
        "content-disposition": 'inline; filename="sidra-portfolio-file"',
        "cache-control": "private, no-store, max-age=0",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : "File preview failed.";

    const status =
      message === "AUTH_REQUIRED" ||
      message === "INVALID_FIREBASE_SESSION"
        ? 401
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

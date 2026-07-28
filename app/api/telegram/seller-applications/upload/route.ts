import { NextResponse } from "next/server";
import { verifyFirebaseRequest } from "@/lib/server/firebaseIdentity";
import { sendTelegramDocument } from "@/lib/server/telegramBot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_FILE_BYTES = 4 * 1024 * 1024;

function errorResponse(caught: unknown): NextResponse {
  const message =
    caught instanceof Error ? caught.message : "Telegram upload failed.";

  const status =
    message === "AUTH_REQUIRED" ||
    message === "INVALID_FIREBASE_SESSION"
      ? 401
      : message === "FORBIDDEN"
        ? 403
        : 500;

  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const identity = await verifyFirebaseRequest(request);

    if (!identity.emailVerified) {
      throw new Error("FORBIDDEN");
    }

    const form = await request.formData();
    const file = form.get("file");
    const ownerUid = String(form.get("ownerUid") ?? "");
    const applicationId = String(form.get("applicationId") ?? "").slice(
      0,
      100,
    );
    const index = String(form.get("index") ?? "1").slice(0, 10);
    const total = String(form.get("total") ?? "1").slice(0, 10);
    const replyToMessageId = Number(form.get("replyToMessageId"));

    if (ownerUid !== identity.uid) {
      throw new Error("FORBIDDEN");
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Portfolio file is missing." },
        { status: 400 },
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: `${file.name} is not an image.` },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          error: `${file.name} is larger than 4 MB. Compress it and try again.`,
        },
        { status: 413 },
      );
    }

    if (!applicationId || !Number.isInteger(replyToMessageId)) {
      return NextResponse.json(
        { error: "Telegram application reference is invalid." },
        { status: 400 },
      );
    }

    const message = await sendTelegramDocument({
      file,
      replyToMessageId,
      caption: [
        `SIDRA PORTFOLIO ${index}/${total}`,
        `Application ID: ${applicationId}`,
        `Seller UID: ${identity.uid}`,
        `File: ${file.name}`,
      ].join("\n"),
    });

    if (!message.document) {
      throw new Error("Telegram did not return a document reference.");
    }

    return NextResponse.json({
      telegramFileId: message.document.file_id,
      telegramFileUniqueId: message.document.file_unique_id,
      telegramMessageId: message.message_id,
      fileName: message.document.file_name || file.name,
      contentType: message.document.mime_type || file.type,
      size: message.document.file_size || file.size,
    });
  } catch (caught) {
    return errorResponse(caught);
  }
}

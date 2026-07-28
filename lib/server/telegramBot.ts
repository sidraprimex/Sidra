interface TelegramApiEnvelope<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

export interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramMessage {
  message_id: number;
  chat: {
    id: number | string;
  };
  document?: TelegramDocument;
}

export interface TelegramFile {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
}

function botToken(): string {
  const value = process.env.TELEGRAM_BOT_TOKEN?.trim();

  if (!value) {
    throw new Error("Telegram bot token is not configured.");
  }

  return value;
}

export function telegramChatId(): string {
  const value = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!value) {
    throw new Error("Telegram chat ID is not configured.");
  }

  return value;
}

async function telegramRequest<T>(
  method: string,
  body?: BodyInit,
  headers?: HeadersInit,
): Promise<T> {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken()}/${method}`,
    {
      method: "POST",
      body,
      headers,
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as TelegramApiEnvelope<T>;

  if (!response.ok || !payload.ok || payload.result === undefined) {
    throw new Error(
      payload.description || `Telegram ${method} request failed.`,
    );
  }

  return payload.result;
}

export async function sendTelegramMessage(
  text: string,
): Promise<TelegramMessage> {
  const body = new URLSearchParams({
    chat_id: telegramChatId(),
    text,
    disable_web_page_preview: "true",
  });

  return telegramRequest<TelegramMessage>(
    "sendMessage",
    body,
    {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  );
}

export async function sendTelegramDocument(params: {
  file: File;
  caption: string;
  replyToMessageId: number;
}): Promise<TelegramMessage> {
  const body = new FormData();

  body.set("chat_id", telegramChatId());
  body.set("document", params.file, params.file.name);
  body.set("caption", params.caption);
  body.set(
    "reply_parameters",
    JSON.stringify({
      message_id: params.replyToMessageId,
      allow_sending_without_reply: true,
    }),
  );

  return telegramRequest<TelegramMessage>("sendDocument", body);
}

export async function getTelegramFile(
  fileId: string,
): Promise<TelegramFile> {
  const body = new URLSearchParams({
    file_id: fileId,
  });

  return telegramRequest<TelegramFile>(
    "getFile",
    body,
    {
      "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  );
}

export function telegramFileDownloadUrl(filePath: string): string {
  return `https://api.telegram.org/file/bot${botToken()}/${filePath}`;
}

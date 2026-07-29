"use client";

import { useEffect, useMemo, useState } from "react";
import {
  sendCustomOrderMessage,
  subscribeCustomOrderMessages,
} from "@/services/customOrderService";
import type { CustomOrderMessage } from "@/types/phase8-custom-orders";

function messageTime(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toLocaleString("en-IN");
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? value
      : parsed.toLocaleString("en-IN");
  }
  return "Just now";
}

export function CustomOrderConversation({
  customOrderId,
  legacyMessages,
  unlocked,
}: {
  readonly customOrderId: string;
  readonly legacyMessages: readonly CustomOrderMessage[];
  readonly unlocked: boolean;
}): React.JSX.Element {
  const [liveMessages, setLiveMessages] = useState<
    readonly CustomOrderMessage[]
  >([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!unlocked) {
      setLiveMessages([]);
      return;
    }
    return subscribeCustomOrderMessages(
      customOrderId,
      setLiveMessages,
    );
  }, [customOrderId, unlocked]);

  const messages = useMemo(
    () => [...legacyMessages, ...liveMessages],
    [legacyMessages, liveMessages],
  );

  const send = async (): Promise<void> => {
    const value = body.trim();
    if (!value || !unlocked) return;
    setBusy(true);
    setError(null);
    try {
      await sendCustomOrderMessage({
        customOrderId,
        body: value,
        attachmentUrls: [],
      });
      setBody("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Message could not be sent.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-[var(--radius-lg)] border border-border bg-card p-6">
      <h2 className="font-heading text-2xl">
        Private order conversation
      </h2>
      {!unlocked ? (
        <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-background p-5">
          <p className="font-semibold">Chat is locked</p>
          <p className="mt-2 text-sm leading-7 text-muted">
            Buyer and Studio can message each other only after
            Sidra verifies the custom-order payment.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid max-h-[32rem] gap-3 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-sm text-muted">
                Payment is verified. Begin the private project
                conversation.
              </p>
            ) : (
              messages.map((message) => (
                <article
                  key={message.messageId}
                  className="rounded-[var(--radius-md)] border border-border bg-background p-4"
                >
                  <div className="flex justify-between gap-3 text-xs text-muted">
                    <span>{message.senderRole}</span>
                    <span>{messageTime(message.createdAt)}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap leading-7">
                    {message.body}
                  </p>
                </article>
              ))
            )}
          </div>
          <div className="mt-5 grid gap-3">
            <textarea
              rows={4}
              maxLength={5000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write a clear project message"
              className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3"
            />
            <button
              type="button"
              disabled={busy || body.trim().length === 0}
              onClick={() => void send()}
              className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send message"}
            </button>
            {error ? (
              <p className="text-sm text-red-700">{error}</p>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}

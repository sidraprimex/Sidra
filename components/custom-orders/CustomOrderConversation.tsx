"use client";

import { useState } from "react";
import { sendCustomOrderMessage } from "@/services/customOrderService";
import type { CustomOrderMessage } from "@/types/phase8-custom-orders";

export function CustomOrderConversation({
  customOrderId,
  messages,
}: {
  readonly customOrderId: string;
  readonly messages: readonly CustomOrderMessage[];
}): React.JSX.Element {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const value = body.trim();
    if (!value) return;
    setBusy(true);
    try {
      await sendCustomOrderMessage({ customOrderId, body: value, attachmentUrls: [] });
      setBody("");
    } finally {
      setBusy(false);
    }
  };

  return <section className="rounded-[var(--radius-lg)] border border-border bg-card p-6">
    <h2 className="font-heading text-2xl">Conversation</h2>
    <div className="mt-5 grid max-h-[32rem] gap-3 overflow-y-auto">
      {messages.length === 0 ? <p className="text-sm text-muted">No messages yet.</p> : messages.map((message) => <article key={message.messageId} className="rounded-[var(--radius-md)] border border-border bg-background p-4">
        <div className="flex justify-between gap-3 text-xs text-muted"><span>{message.senderRole}</span><span>{message.createdAt}</span></div>
        <p className="mt-3 whitespace-pre-wrap leading-7">{message.body}</p>
      </article>)}
    </div>
    <div className="mt-5 grid gap-3">
      <textarea rows={4} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a clear project message" className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" />
      <button type="button" disabled={busy || body.trim().length === 0} onClick={() => void send()} className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50">{busy ? "Sending…" : "Send message"}</button>
    </div>
  </section>;
}

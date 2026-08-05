"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

export function UpiPaymentQr({
  upiId,
  payeeName,
  amountPaise,
  reference,
}: {
  readonly upiId: string;
  readonly payeeName: string;
  readonly amountPaise?: number;
  readonly reference?: string;
}): React.JSX.Element | null {
  const [image, setImage] = useState("");
  const paymentUri = useMemo(() => {
    const params = new URLSearchParams({
      pa: upiId.trim(),
      pn: payeeName.trim() || "Sidra",
      cu: "INR",
    });
    if (amountPaise && amountPaise > 0) params.set("am", (amountPaise / 100).toFixed(2));
    if (reference) params.set("tn", reference.slice(0, 80));
    return `upi://pay?${params.toString()}`;
  }, [amountPaise, payeeName, reference, upiId]);

  useEffect(() => {
    if (!upiId.includes("@")) {
      setImage("");
      return;
    }
    void QRCode.toDataURL(paymentUri, {
      width: 420,
      margin: 2,
      color: { dark: "#3b1e35", light: "#fffaf7" },
      errorCorrectionLevel: "M",
    }).then(setImage).catch(() => setImage(""));
  }, [paymentUri, upiId]);

  if (!image) return null;

  return (
    <div className="grid justify-items-center rounded-2xl border border-black/10 bg-white p-5 text-center">
      {/* Generated data URLs should not pass through the Next image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={`UPI payment QR for ${upiId}`} className="h-56 w-56 rounded-xl" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[.16em] text-black/55">Scan with any UPI app</p>
      <p className="mt-2 break-all text-sm font-semibold">{upiId}</p>
    </div>
  );
}

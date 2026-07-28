"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { SellerPortfolioImage } from "@/types/seller-application";

interface SellerPortfolioPreviewProps {
  image: SellerPortfolioImage;
  ownerUid: string;
  className?: string;
  showFileName?: boolean;
}

export function SellerPortfolioPreview({
  image,
  ownerUid,
  className = "",
  showFileName = false,
}: SellerPortfolioPreviewProps): React.JSX.Element {
  const { user } = useAuth();
  const [source, setSource] = useState<string | null>(
    image.downloadUrl || null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (image.provider !== "telegram" || !image.telegramFileId) {
      setSource(image.downloadUrl || null);
      return;
    }

    if (!user) {
      setSource(null);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    void user
      .getIdToken()
      .then(async (token) => {
        const query = new URLSearchParams({
          fileId: image.telegramFileId ?? "",
          ownerUid,
          mimeType: image.contentType || "image/jpeg",
        });

        const response = await fetch(
          `/api/telegram/files?${query.toString()}`,
          {
            headers: {
              authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          },
        );

        if (!response.ok) {
          const payload = (await response
            .json()
            .catch(() => null)) as { error?: string } | null;

          throw new Error(
            payload?.error || "Portfolio preview could not be loaded.",
          );
        }

        objectUrl = URL.createObjectURL(await response.blob());

        if (active) {
          setSource(objectUrl);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Portfolio preview could not be loaded.",
          );
        }
      });

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [
    image.contentType,
    image.downloadUrl,
    image.provider,
    image.telegramFileId,
    ownerUid,
    user,
  ]);

  return (
    <a
      href={source ?? undefined}
      target={source ? "_blank" : undefined}
      rel={source ? "noreferrer" : undefined}
      className={`group relative overflow-hidden rounded-2xl border border-black/10 bg-gray-100 ${className}`}
      aria-label={`Open ${image.fileName}`}
    >
      {source ? (
        <img
          src={source}
          alt={image.fileName}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full min-h-36 items-center justify-center p-4 text-center text-xs text-gray-600">
          {error || "Loading secure preview…"}
        </span>
      )}

      <span className="absolute inset-x-0 bottom-0 bg-black/75 p-2 text-xs text-white">
        {showFileName ? image.fileName : "Open image"}
      </span>
    </a>
  );
}

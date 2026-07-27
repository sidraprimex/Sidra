"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { watchOwnSellerApplication } from "@/services/sellerApplicationService";
import type { SellerApplication } from "@/types/seller-application";

const statusCopy: Record<
  SellerApplication["status"],
  {
    label: string;
    message: string;
    tone: string;
    step: number;
  }
> = {
  pending: {
    label: "Pending admin review",
    message:
      "Your Studio request was received and is waiting for admin review.",
    tone: "bg-amber-100 text-amber-900",
    step: 1,
  },
  approved: {
    label: "Approved",
    message:
      "Your application is approved. Secure Studio setup is starting.",
    tone: "bg-emerald-100 text-emerald-900",
    step: 2,
  },
  provisioning: {
    label: "Studio setup in progress",
    message:
      "Your Studio, storage, analytics and seller access are being prepared.",
    tone: "bg-blue-100 text-blue-900",
    step: 3,
  },
  provisioned: {
    label: "Studio ready",
    message:
      "Your seller permissions are active. You can now enter your Studio dashboard.",
    tone: "bg-emerald-100 text-emerald-900",
    step: 4,
  },
  rejected: {
    label: "Not approved",
    message:
      "The admin did not approve this request. Review the note below before applying again.",
    tone: "bg-rose-100 text-rose-900",
    step: 1,
  },
  moreInfoRequested: {
    label: "More information required",
    message:
      "The admin needs more details before making a decision.",
    tone: "bg-amber-100 text-amber-900",
    step: 1,
  },
  onHold: {
    label: "On hold",
    message:
      "Your request is safely saved and currently on hold for admin review.",
    tone: "bg-slate-200 text-slate-900",
    step: 1,
  },
  provisioningFailed: {
    label: "Setup needs attention",
    message:
      "Studio setup could not finish automatically. The admin has been alerted.",
    tone: "bg-rose-100 text-rose-900",
    step: 2,
  },
};

export function ApplicationStatusPanel({
  uid,
  onPresenceChange,
}: {
  uid: string;
  onPresenceChange?: (present: boolean) => void;
}) {
  const { refresh } = useAuth();
  const [application, setApplication] =
    useState<SellerApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      watchOwnSellerApplication(
        uid,
        (value) => {
          setApplication(value);
          setLoading(false);
          onPresenceChange?.(Boolean(value));

          if (value?.status === "provisioned") {
            void refresh();
          }
        },
        (caught) => {
          setError(caught.message);
          setLoading(false);
        },
      ),
    [onPresenceChange, refresh, uid],
  );

  const current = useMemo(
    () => (application ? statusCopy[application.status] : null),
    [application],
  );

  if (loading) return <LoadingSkeleton count={2} />;
  if (error) return <ErrorState message={error} />;
  if (!application || !current) return null;

  return (
    <Card
      id="studio-application-status"
      elevated
      className="border-gold-500/30"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-600">
            Studio application
          </p>
          <h2 className="mt-3 font-display text-h2">
            {application.studioName}
          </h2>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-xs font-semibold ${current.tone}`}
        >
          {current.label}
        </span>
      </div>

      <div
        className="mt-6 grid grid-cols-4 gap-2"
        aria-label={`Application step ${current.step} of 4`}
      >
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-2 rounded-full ${
              step <= current.step
                ? "bg-[var(--color-deep-plum)]"
                : "bg-black/10"
            }`}
          />
        ))}
      </div>

      <p className="mt-5 text-body text-gray-700">
        {current.message}
      </p>

      <p className="mt-3 text-caption text-gray-600">
        You can return here anytime from Buyer Dashboard - Menu -
        Studio application.
      </p>

      {application.reviewNote ? (
        <div className="mt-5 rounded-2xl border border-gold-500/20 bg-gold-100/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[.18em]">
            Admin note
          </p>
          <p className="mt-2 text-caption text-black-900">
            {application.reviewNote}
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {application.status === "provisioned" ? (
          <Link
            className="inline-flex min-h-12 items-center rounded-full bg-[var(--color-deep-plum)] px-5 py-3 text-caption font-semibold text-white"
            href="/studio-admin/overview"
          >
            Enter Studio dashboard
          </Link>
        ) : null}

        <Link
          className="inline-flex min-h-12 items-center rounded-full border border-[var(--color-deep-plum)] px-5 py-3 text-caption font-semibold text-[var(--color-deep-plum)]"
          href="/account/dashboard"
        >
          Back to buyer dashboard
        </Link>
      </div>
    </Card>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { SellerPortfolioPreview } from "@/components/seller-onboarding/SellerPortfolioPreview";
import {
  rejectSellerAccessPayment,
  reviewSellerApplication,
  verifySellerAccessPayment,
  watchSellerApplications,
} from "@/services/sellerApplicationService";
import type {
  SellerApplication,
  SellerApplicationDecision,
} from "@/types/seller-application";

function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

const reviewableStatuses = [
  "pending",
  "moreInfoRequested",
  "onHold",
  "provisioningFailed",
] as const;

export function SellerApplicationsReview(): React.JSX.Element {
  const [items, setItems] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [working, setWorking] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(
    () =>
      watchSellerApplications(
        (values) => {
          setItems(values);
          setLoading(false);
        },
        (caught) => {
          setError(caught.message);
          setLoading(false);
        },
      ),
    [],
  );

  const visibleItems = useMemo(
    () =>
      statusFilter === "all"
        ? items
        : items.filter((item) => item.status === statusFilter),
    [items, statusFilter],
  );

  const decide = async (
    item: SellerApplication,
    decision: SellerApplicationDecision,
  ) => {
    const note = notes[item.id]?.trim() ?? "";

    if (decision !== "approve" && note.length < 3) {
      setError("Add a clear admin note before this decision.");
      return;
    }

    setWorking(`${item.id}:${decision}`);
    setError(null);

    try {
      await reviewSellerApplication({
        applicationId: item.id,
        decision,
        note,
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The decision could not be saved.",
      );
    } finally {
      setWorking(null);
    }
  };

  const verify = async (item: SellerApplication) => {
    setWorking(`${item.id}:verify`);
    setError(null);

    try {
      await verifySellerAccessPayment(
        item.id,
        notes[item.id] ?? "",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Payment could not be verified.",
      );
    } finally {
      setWorking(null);
    }
  };

  const rejectPayment = async (item: SellerApplication) => {
    const note = notes[item.id]?.trim() ?? "";

    if (note.length < 3) {
      setError("Add a reason before rejecting payment.");
      return;
    }

    setWorking(`${item.id}:reject-payment`);
    setError(null);

    try {
      await rejectSellerAccessPayment(item.id, note);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Payment rejection could not be saved.",
      );
    } finally {
      setWorking(null);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={4} />;
  }

  if (error && items.length === 0) {
    return <ErrorState message={error} />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No Studio applications found"
        message="Every saved draft, pending review, approval, rejection and payment submission will appear here in real time."
      />
    );
  }

  return (
    <div className="grid gap-6">
      {error ? (
        <ErrorState message={error} onRetry={() => setError(null)} />
      ) : null}

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-micro font-semibold uppercase tracking-[0.18em] text-gold-600">
            Live application register
          </p>
          <p className="mt-2 text-caption text-gray-700">
            {items.length} saved application
            {items.length === 1 ? "" : "s"} connected to Firestore.
          </p>
        </div>

        <label className="grid gap-2 text-caption font-semibold">
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="min-h-11 rounded-2xl border border-black/10 bg-white px-4"
          >
            <option value="all">All applications</option>
            <option value="uploading">Uploading</option>
            <option value="submissionFailed">Upload incomplete</option>
            <option value="pending">Pending review</option>
            <option value="approved">Approved</option>
            <option value="paymentSubmitted">Payment submitted</option>
            <option value="rejected">Rejected</option>
            <option value="moreInfoRequested">
              More information requested
            </option>
            <option value="onHold">On hold</option>
            <option value="provisioned">Studio ready</option>
            <option value="provisioningFailed">
              Provisioning failed
            </option>
          </select>
        </label>
      </Card>

      {visibleItems.length === 0 ? (
        <EmptyState
          title="No applications in this status"
          message="Choose another status to view the full application register."
        />
      ) : null}

      {visibleItems.map((item) => {
        const canReview = reviewableStatuses.includes(
          item.status as (typeof reviewableStatuses)[number],
        );

        return (
          <Card key={item.id} elevated className="grid gap-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-micro font-semibold uppercase tracking-[0.18em] text-gold-600">
                  {item.status}
                </p>
                <h2 className="mt-2 font-display text-h2">
                  {item.studioName}
                </h2>
                <p className="mt-1 text-caption text-gray-700">
                  {item.fullName} · {item.city}, {item.state}
                </p>
                <p className="mt-2 break-all text-micro text-gray-500">
                  Application ID: {item.id}
                </p>
              </div>

              <p className="text-caption text-gray-700">
                Capacity {item.expectedMonthlyCapacity}/month
              </p>
            </header>

            <dl className="grid gap-4 text-caption sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="font-semibold">Email</dt>
                <dd className="mt-1 break-all text-gray-700">
                  {item.email}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Mobile</dt>
                <dd className="mt-1 text-gray-700">{item.mobile}</dd>
              </div>
              <div>
                <dt className="font-semibold">Instagram</dt>
                <dd className="mt-1 break-all text-gray-700">
                  {item.instagram || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Categories</dt>
                <dd className="mt-1 text-gray-700">
                  {item.productCategories.join(", ") || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Access fee</dt>
                <dd className="mt-1 text-gray-700">
                  {item.accessFeePaise > 0
                    ? formatInr(item.accessFeePaise)
                    : "Not published"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Portfolio files</dt>
                <dd className="mt-1 text-gray-700">
                  {item.portfolioImages.length}
                </dd>
              </div>
            </dl>

            <section>
              <h3 className="font-display text-h3">
                Craft experience
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-caption text-gray-700">
                {item.experience}
              </p>
            </section>

            <section>
              <h3 className="font-display text-h3">
                Reason for joining
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-caption text-gray-700">
                {item.whyJoin}
              </p>
            </section>

            {item.failureReason ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-caption text-rose-900">
                <strong>Submission issue</strong>
                <br />
                {item.failureReason}
              </div>
            ) : null}

            <section>
              <h3 className="font-display text-h3">
                Attached portfolio
              </h3>

              {item.portfolioImages.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-caption text-amber-900">
                  No portfolio file is attached yet. The seller can retry
                  the same saved application from the status page.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {item.portfolioImages.map((image) => (
                    <SellerPortfolioPreview
                      key={image.path}
                      image={image}
                      ownerUid={item.uid}
                      className="aspect-square"
                      showFileName
                    />
                  ))}
                </div>
              )}
            </section>

            {item.paymentReference ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-caption">
                <strong>Payment submitted</strong>
                <br />
                Method: {item.paymentMethod}
                <br />
                Reference: {item.paymentReference}
              </div>
            ) : null}

            <label className="grid gap-2 text-caption font-semibold">
              Admin note
              <textarea
                className="min-h-24 rounded-sm border border-gray-300 bg-ivory-50 p-4 text-body font-normal"
                value={notes[item.id] ?? ""}
                onChange={(event) =>
                  setNotes((current) => ({
                    ...current,
                    [item.id]: event.target.value,
                  }))
                }
              />
            </label>

            {canReview ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Button
                  loading={working === `${item.id}:approve`}
                  onClick={() => void decide(item, "approve")}
                >
                  Approve for payment
                </Button>
                <Button
                  variant="outline"
                  loading={working === `${item.id}:requestMoreInfo`}
                  onClick={() =>
                    void decide(item, "requestMoreInfo")
                  }
                >
                  Request more info
                </Button>
                <Button
                  variant="ghost"
                  loading={working === `${item.id}:hold`}
                  onClick={() => void decide(item, "hold")}
                >
                  Hold
                </Button>
                <Button
                  variant="danger"
                  loading={working === `${item.id}:reject`}
                  onClick={() => void decide(item, "reject")}
                >
                  Reject
                </Button>
              </div>
            ) : null}

            {item.status === "approved" ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-caption">
                Application approved. Waiting for the seller to submit
                payment.
              </p>
            ) : null}

            {item.status === "paymentSubmitted" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  loading={working === `${item.id}:verify`}
                  onClick={() => void verify(item)}
                >
                  Verify payment & unlock Studio
                </Button>
                <Button
                  variant="danger"
                  loading={working === `${item.id}:reject-payment`}
                  onClick={() => void rejectPayment(item)}
                >
                  Reject payment reference
                </Button>
              </div>
            ) : null}

            {item.status === "provisioned" ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-caption text-emerald-900">
                Studio access is active. Studio ID:{" "}
                <strong>{item.studioId}</strong>
              </p>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  couponDiscountLabel,
  listCustomerSegments,
  listSellerCampaigns,
  listSellerCoupons,
  saveCustomerSegment,
  saveSellerCampaign,
  saveSellerCoupon,
  setSellerCouponActive,
} from "@/services/sellerGrowthService";
import type {
  CouponDiscountType,
  CustomerSegment,
  SellerCampaign,
  SellerCoupon,
} from "@/types/phase11-seller-growth";
import { formatInr } from "@/utils/cartTotals";

type Mode = "coupon" | "segment" | "campaign";

interface SellerGrowthManagerProps {
  readonly studioId: string;
  readonly mode: Mode;
  readonly segmentOptions?: readonly {
    id: string;
    name: string;
  }[];
}

export function SellerGrowthManager({
  studioId,
  mode,
  segmentOptions = [],
}: SellerGrowthManagerProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [secondary, setSecondary] = useState("");
  const [message, setMessage] = useState("");
  const [segmentId, setSegmentId] = useState(
    segmentOptions[0]?.id ?? "",
  );
  const [discountType, setDiscountType] =
    useState<CouponDiscountType>("percentage");
  const [discountValue, setDiscountValue] = useState("10");
  const [minimumOrder, setMinimumOrder] = useState("0");
  const [busy, setBusy] = useState(false);
  const [busyCouponId, setBusyCouponId] =
    useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [coupons, setCoupons] = useState<
    readonly SellerCoupon[]
  >([]);
  const [segments, setSegments] = useState<
    readonly CustomerSegment[]
  >([]);
  const [campaigns, setCampaigns] = useState<
    readonly SellerCampaign[]
  >([]);

  useEffect(() => {
    if (
      !segmentOptions.some((option) => option.id === segmentId)
    ) {
      setSegmentId(segmentOptions[0]?.id ?? "");
    }
  }, [segmentId, segmentOptions]);

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      if (mode === "coupon") {
        setCoupons(await listSellerCoupons(studioId));
      } else if (mode === "segment") {
        setSegments(await listCustomerSegments(studioId));
      } else {
        setCampaigns(await listSellerCampaigns(studioId));
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Saved records could not be loaded.",
      );
    } finally {
      setLoadingRecords(false);
    }
  }, [mode, studioId]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const save = async (): Promise<void> => {
    setBusy(true);
    setError(null);
    setSavedId(null);
    try {
      if (mode === "coupon") {
        const parsedValue = Number(discountValue);
        const parsedMinimum = Number(minimumOrder);
        if (!Number.isFinite(parsedValue)) {
          throw new Error("Enter a valid discount.");
        }
        if (!Number.isFinite(parsedMinimum) || parsedMinimum < 0) {
          throw new Error("Enter a valid minimum order.");
        }
        const result = await saveSellerCoupon({
          studioId,
          code: name,
          title: secondary,
          discountType,
          discountValue:
            discountType === "fixed"
              ? Math.round(parsedValue * 100)
              : Math.round(parsedValue),
          minimumOrderPaise: Math.round(parsedMinimum * 100),
          active: true,
        });
        setSavedId(result.couponId);
      } else if (mode === "segment") {
        const result = await saveCustomerSegment({
          studioId,
          name,
          description: secondary,
          rule: "all",
        });
        setSavedId(result.segmentId);
      } else {
        const result = await saveSellerCampaign({
          studioId,
          name,
          subject: secondary,
          message,
          segmentId,
        });
        setSavedId(result.campaignId);
      }
      setName("");
      setSecondary("");
      setMessage("");
      await loadRecords();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The record could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };

  const toggleCoupon = async (
    coupon: SellerCoupon,
  ): Promise<void> => {
    setBusyCouponId(coupon.couponId);
    setError(null);
    try {
      await setSellerCouponActive(
        coupon.couponId,
        !coupon.active,
      );
      await loadRecords();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Coupon status could not be changed.",
      );
    } finally {
      setBusyCouponId(null);
    }
  };

  const saveDisabled =
    busy ||
    name.trim().length < 3 ||
    secondary.trim().length < 3 ||
    (mode === "campaign" &&
      (!segmentId || message.trim().length < 10));

  return (
    <div className="grid gap-6">
      {mode === "campaign" ? (
        <aside className="rounded-[var(--radius-lg)] border border-[var(--color-warning)] bg-card p-5 text-sm leading-7">
          Campaigns are saved as drafts only. Nothing is emailed or
          messaged automatically until a delivery provider is
          connected and approved.
        </aside>
      ) : null}

      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-6">
        <h2 className="font-heading text-3xl">
          {mode === "coupon"
            ? "Create seller coupon"
            : mode === "segment"
              ? "Create customer segment"
              : "Create campaign draft"}
        </h2>
        <label className="grid gap-2">
          <span>{mode === "coupon" ? "Coupon code" : "Name"}</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3"
            placeholder={
              mode === "coupon" ? "Example: ZARA10" : undefined
            }
          />
        </label>
        <label className="grid gap-2">
          <span>
            {mode === "campaign"
              ? "Subject"
              : mode === "coupon"
                ? "Customer-facing title"
                : "Description"}
          </span>
          <input
            value={secondary}
            onChange={(event) =>
              setSecondary(event.target.value)
            }
            className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3"
          />
        </label>

        {mode === "coupon" ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2">
              <span>Discount type</span>
              <select
                value={discountType}
                onChange={(event) =>
                  setDiscountType(
                    event.target.value as CouponDiscountType,
                  )
                }
                className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span>
                {discountType === "percentage"
                  ? "Discount (%)"
                  : "Discount (₹)"}
              </span>
              <input
                type="number"
                min={discountType === "percentage" ? 1 : 1}
                max={
                  discountType === "percentage" ? 90 : undefined
                }
                step={discountType === "percentage" ? 1 : 0.01}
                value={discountValue}
                onChange={(event) =>
                  setDiscountValue(event.target.value)
                }
                className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3"
              />
            </label>
            <label className="grid gap-2">
              <span>Minimum seller order (₹)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={minimumOrder}
                onChange={(event) =>
                  setMinimumOrder(event.target.value)
                }
                className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3"
              />
            </label>
          </div>
        ) : null}

        {mode === "campaign" ? (
          <>
            <label className="grid gap-2">
              <span>Audience</span>
              <select
                value={segmentId}
                onChange={(event) =>
                  setSegmentId(event.target.value)
                }
                className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3"
              >
                {segmentOptions.length === 0 ? (
                  <option value="">
                    Create a customer segment first
                  </option>
                ) : null}
                {segmentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span>Message</span>
              <textarea
                rows={7}
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3"
              />
            </label>
          </>
        ) : null}

        <button
          type="button"
          disabled={saveDisabled}
          onClick={() => void save()}
          className="justify-self-start rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        {savedId ? (
          <p className="text-sm text-muted">
            Saved successfully: {savedId}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-6">
        <h2 className="font-heading text-3xl">
          {mode === "coupon"
            ? "Your coupons"
            : mode === "segment"
              ? "Saved segments"
              : "Campaign drafts"}
        </h2>
        {loadingRecords ? (
          <p className="text-sm text-muted">Loading saved records…</p>
        ) : null}

        {!loadingRecords && mode === "coupon" ? (
          coupons.length === 0 ? (
            <p className="text-sm text-muted">
              No coupons created yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {coupons.map((coupon) => (
                <article
                  key={coupon.couponId}
                  className="flex flex-col justify-between gap-4 rounded-[var(--radius-md)] border border-border p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold">{coupon.code}</p>
                    <p className="mt-1 text-sm text-muted">
                      {coupon.title} ·{" "}
                      {couponDiscountLabel(coupon)}
                      {coupon.minimumOrderPaise > 0
                        ? ` · minimum ${formatInr(coupon.minimumOrderPaise)}`
                        : ""}{" "}
                      · used {coupon.usedCount} time
                      {coupon.usedCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busyCouponId === coupon.couponId}
                    onClick={() => void toggleCoupon(coupon)}
                    className="rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {busyCouponId === coupon.couponId
                      ? "Updating…"
                      : coupon.active
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                </article>
              ))}
            </div>
          )
        ) : null}

        {!loadingRecords && mode === "segment" ? (
          segments.length === 0 ? (
            <p className="text-sm text-muted">
              No customer segments created yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {segments.map((segment) => (
                <article
                  key={segment.segmentId}
                  className="rounded-[var(--radius-md)] border border-border p-4"
                >
                  <p className="font-semibold">{segment.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {segment.description} · {segment.customerCount}{" "}
                    customers
                  </p>
                </article>
              ))}
            </div>
          )
        ) : null}

        {!loadingRecords && mode === "campaign" ? (
          campaigns.length === 0 ? (
            <p className="text-sm text-muted">
              No campaign drafts created yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {campaigns.map((campaign) => (
                <article
                  key={campaign.campaignId}
                  className="rounded-[var(--radius-md)] border border-border p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{campaign.name}</p>
                    <span className="rounded-full border border-border px-3 py-1 text-xs uppercase">
                      {campaign.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {campaign.subject}
                  </p>
                </article>
              ))}
            </div>
          )
        ) : null}
      </section>
    </div>
  );
}

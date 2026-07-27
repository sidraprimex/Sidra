"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { reviewSellerApplication, watchSellerApplications } from "@/services/sellerApplicationService";
import type { SellerApplication, SellerApplicationDecision } from "@/types/seller-application";

export function SellerApplicationsReview() {
  const [items, setItems] = useState<SellerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [working, setWorking] = useState<string | null>(null);

  useEffect(
    () => watchSellerApplications(
      (values) => { setItems(values); setLoading(false); },
      (caught) => { setError(caught.message); setLoading(false); },
    ),
    [],
  );

  const pending = useMemo(
    () => items.filter((item) => ["pending", "moreInfoRequested", "onHold", "provisioningFailed"].includes(item.status)),
    [items],
  );

  const act = async (item: SellerApplication, decision: SellerApplicationDecision) => {
    const note = notes[item.id]?.trim() ?? "";
    if (decision !== "approve" && note.length < 3) {
      setError("Add a clear admin note before this decision.");
      return;
    }
    setWorking(`${item.id}:${decision}`);
    setError(null);
    try {
      await reviewSellerApplication({ applicationId: item.id, decision, note });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The decision could not be saved.");
    } finally {
      setWorking(null);
    }
  };

  if (loading) return <LoadingSkeleton count={4} />;
  if (error && items.length === 0) return <ErrorState message={error} />;
  if (pending.length === 0) return <EmptyState title="No Studio requests waiting" message="New verified seller requests will appear here for admin review." />;

  return (
    <div className="grid gap-6">
      {error ? <ErrorState message={error} onRetry={() => setError(null)} /> : null}
      {pending.map((item) => (
        <Card key={item.id} elevated className="grid gap-5">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-micro font-semibold uppercase tracking-[0.18em] text-gold-600">{item.status}</p>
              <h2 className="mt-2 font-display text-h2">{item.studioName}</h2>
              <p className="mt-1 text-caption text-gray-700">{item.fullName} · {item.city}, {item.state}</p>
            </div>
            <p className="text-caption text-gray-700">Capacity {item.expectedMonthlyCapacity}/month</p>
          </header>

          <dl className="grid gap-4 text-caption sm:grid-cols-2">
            <div><dt className="font-semibold">Email</dt><dd className="mt-1 text-gray-700">{item.email}</dd></div>
            <div><dt className="font-semibold">Mobile</dt><dd className="mt-1 text-gray-700">{item.mobile}</dd></div>
            <div><dt className="font-semibold">Categories</dt><dd className="mt-1 text-gray-700">{item.productCategories.join(", ")}</dd></div>
            <div><dt className="font-semibold">Instagram</dt><dd className="mt-1 text-gray-700">{item.instagram ?? "Not provided"}</dd></div>
          </dl>

          <section><h3 className="font-display text-h3">Craft experience</h3><p className="mt-2 whitespace-pre-wrap text-caption text-gray-700">{item.experience}</p></section>
          <section><h3 className="font-display text-h3">Reason for joining</h3><p className="mt-2 whitespace-pre-wrap text-caption text-gray-700">{item.whyJoin}</p></section>
          <section>
            <h3 className="font-display text-h3">Portfolio</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {item.portfolioImages.map((image) => (
                <a key={image.path} href={image.downloadUrl} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-sm border border-gray-100 bg-gray-100" aria-label={`Open ${image.fileName}`}>
                  <span className="absolute inset-0 bg-cover bg-center transition duration-base ease-luxury group-hover:scale-105" style={{ backgroundImage: `url(${image.downloadUrl})` }} />
                  <span className="absolute inset-x-0 bottom-0 bg-black-900/70 p-2 text-micro text-ivory-50">Open image</span>
                </a>
              ))}
            </div>
          </section>

          <label className="grid gap-2 text-caption font-semibold">
            Admin review note
            <textarea className="min-h-24 rounded-sm border border-gray-300 bg-ivory-50 p-4 text-body font-normal" value={notes[item.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} />
          </label>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button loading={working === `${item.id}:approve`} onClick={() => void act(item, "approve")}>Approve & create Studio</Button>
            <Button variant="outline" loading={working === `${item.id}:requestMoreInfo`} onClick={() => void act(item, "requestMoreInfo")}>Request more info</Button>
            <Button variant="ghost" loading={working === `${item.id}:hold`} onClick={() => void act(item, "hold")}>Hold</Button>
            <Button variant="danger" loading={working === `${item.id}:reject`} onClick={() => void act(item, "reject")}>Reject</Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

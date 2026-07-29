"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getAdminDocument,
  saveIntegrationSettings,
  savePaymentSettings,
  saveThemeSettings,
  setAdminDocument,
  toEditableRecord,
} from "@/services/adminOperatingService";
import { defaultThemeSettings } from "@/services/runtimeConfigService";
import { defaultPaymentSettings } from "@/services/paymentConfigurationService";
import type { AdminWorkspaceTab, SidraIntegrationSettings, SidraPaymentSettings, SidraThemeSettings } from "@/types/admin-os";
import type { CmsBlock } from "@/types/cms";

const blankIntegration: Omit<SidraIntegrationSettings, "updatedAt" | "updatedBy"> = {
  razorpayPublicKey: "",
  razorpayConfigured: false,
  appleSignInConfigured: false,
  googleSignInConfigured: true,
  emailProvider: "",
  shippingProvider: "",
  notes: "",
};

export function AdminCmsWorkspace({ actorUid, tab }: { readonly actorUid: string; readonly tab: AdminWorkspaceTab }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [theme, setTheme] = useState({ ...defaultThemeSettings });
  const [payments, setPayments] = useState({ ...defaultPaymentSettings });
  const [integrations, setIntegrations] = useState({ ...blankIntegration });
  const [cmsDocumentId, setCmsDocumentId] = useState("homepage");
  const [cmsBlocks, setCmsBlocks] = useState<CmsBlock[]>([]);

  useEffect(() => {
    void Promise.all([
      getAdminDocument("settings", "theme"),
      getAdminDocument("settings", "payments"),
      getAdminDocument("settings", "integrations"),
      getAdminDocument("cms", "homepage"),
    ]).then(([themeDoc, paymentDoc, integrationDoc, cmsDoc]) => {
      if (themeDoc) setTheme((current) => ({ ...current, ...(toEditableRecord(themeDoc.data) as Partial<typeof current>) }));
      if (paymentDoc) setPayments((current) => ({ ...current, ...(toEditableRecord(paymentDoc.data) as Partial<typeof current>) }));
      if (integrationDoc) setIntegrations((current) => ({ ...current, ...(toEditableRecord(integrationDoc.data) as Partial<typeof current>) }));
      if (cmsDoc) {
        const value = toEditableRecord(cmsDoc.data);
        setCmsBlocks(Array.isArray(value.blocks) ? value.blocks as CmsBlock[] : []);
      }
    }).catch((caught: unknown) => setMessage(caught instanceof Error ? caught.message : "CMS settings could not be loaded."));
  }, []);

  const saveTheme = async () => {
    setBusy(true); setMessage(null);
    try {
      await saveThemeSettings({ ...theme, updatedBy: actorUid } as Omit<SidraThemeSettings, "updatedAt">);
      setMessage("Global Sidra colors and radius published. Every page using design tokens updates live.");
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Theme could not be saved."); }
    finally { setBusy(false); }
  };

  const savePayments = async () => {
    setBusy(true); setMessage(null);
    try {
      await savePaymentSettings({ ...payments, updatedBy: actorUid } as Omit<SidraPaymentSettings, "updatedAt">);
      setMessage("Payment mode and customer payment instructions published.");
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Payment settings could not be saved."); }
    finally { setBusy(false); }
  };

  const saveIntegrations = async () => {
    setBusy(true); setMessage(null);
    try {
      await saveIntegrationSettings({ ...integrations, updatedBy: actorUid });
      setMessage("Integration status saved. Secret keys remain protected in hosting environment variables.");
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Integration settings could not be saved."); }
    finally { setBusy(false); }
  };

  const loadCms = async () => {
    setBusy(true); setMessage(null);
    try {
      const value = await getAdminDocument("cms", cmsDocumentId);
      const record = value ? toEditableRecord(value.data) : {};
      setCmsBlocks(Array.isArray(record.blocks) ? record.blocks as CmsBlock[] : []);
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "CMS document could not be loaded."); }
    finally { setBusy(false); }
  };

  const saveCms = async () => {
    setBusy(true); setMessage(null);
    try {
      await setAdminDocument({ collectionName: "cms", documentId: cmsDocumentId, value: { blocks: cmsBlocks.map((block, index) => ({ ...block, order: index + 1 })) }, actorUid, action: "cms.publish", summary: `Published CMS document ${cmsDocumentId}` });
      setMessage(`CMS document “${cmsDocumentId}” published.`);
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "CMS document could not be saved."); }
    finally { setBusy(false); }
  };

  if (tab === "appearance") {
    return <Card elevated>
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">Global appearance</p>
      <h2 className="mt-3 font-display text-5xl text-[var(--color-deep-plum)]">One palette, every Sidra page</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-700">These five design tokens control the platform family. Changes publish without code and are applied by the runtime theme provider.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {([
          ["deepPlum", "Deep plum"], ["dustyRose", "Dusty rose"], ["porcelain", "Porcelain"], ["champagne", "Champagne"], ["deepOnyx", "Deep onyx"],
        ] as const).map(([key, label]) => <label key={key} className="grid gap-2 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm font-semibold">{label}<div className="flex gap-3"><input type="color" value={theme[key]} onChange={(event) => setTheme((current) => ({ ...current, [key]: event.target.value }))} className="h-12 w-16 rounded-xl border-0 bg-transparent" /><input value={theme[key]} onChange={(event) => setTheme((current) => ({ ...current, [key]: event.target.value }))} className="min-w-0 flex-1 rounded-xl border border-black/10 px-3" /></div></label>)}
        <label className="grid gap-2 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm font-semibold">Card radius ({theme.cardRadiusRem.toFixed(1)}rem)<input type="range" min="0.6" max="3" step="0.1" value={theme.cardRadiusRem} onChange={(event) => setTheme((current) => ({ ...current, cardRadiusRem: Number(event.target.value) }))} /></label>
      </div>
      {message ? <p className="mt-5 rounded-2xl bg-white/70 p-4 text-sm">{message}</p> : null}
      <Button className="mt-5" loading={busy} onClick={() => void saveTheme()}>Publish global theme</Button>
    </Card>;
  }

  if (tab === "payments") {
    return <div className="grid gap-6 lg:grid-cols-2">
      <Card elevated>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">Payment control</p>
        <h2 className="mt-3 font-display text-5xl text-[var(--color-deep-plum)]">Switch payment mode</h2>
        <label className="mt-6 grid gap-2 text-sm font-semibold">Mode<select value={payments.mode} onChange={(event) => setPayments((current) => ({ ...current, mode: event.target.value as SidraPaymentSettings["mode"] }))} className="rounded-2xl border border-black/10 bg-white px-4 py-3"><option value="razorpay">Razorpay only</option><option value="manual">Manual bank/UPI only</option><option value="hybrid">Razorpay + manual</option><option value="disabled">Payments disabled</option></select></label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm font-semibold"><input type="checkbox" checked={payments.razorpayEnabled} onChange={(event) => setPayments((current) => ({ ...current, razorpayEnabled: event.target.checked }))} />Razorpay enabled</label><label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm font-semibold"><input type="checkbox" checked={payments.manualEnabled} onChange={(event) => setPayments((current) => ({ ...current, manualEnabled: event.target.checked }))} />Manual verification enabled</label></div>
        {([['upiId','UPI ID'],['accountHolderName','Account holder'],['bankName','Bank name'],['accountNumber','Account number'],['ifsc','IFSC'],['supportContact','Support contact'],['razorpayPaymentLink','Razorpay hosted payment link']] as const).map(([key,label]) => <label key={key} className="mt-4 grid gap-2 text-sm font-semibold">{label}<input value={payments[key]} onChange={(event) => setPayments((current) => ({ ...current, [key]: event.target.value }))} className="rounded-2xl border border-black/10 bg-white px-4 py-3" /></label>)}
        <label className="mt-4 grid gap-2 text-sm font-semibold">Seller Studio access fee (INR)<input type="number" min="0" value={Math.round(payments.sellerAccessFeePaise / 100)} onChange={(event) => setPayments((current) => ({ ...current, sellerAccessFeePaise: Math.max(0, Number(event.target.value) || 0) * 100 }))} className="rounded-2xl border border-black/10 bg-white px-4 py-3" /></label><label className="mt-4 grid gap-2 text-sm font-semibold">Customer instructions<textarea value={payments.instructions} onChange={(event) => setPayments((current) => ({ ...current, instructions: event.target.value }))} className="min-h-32 rounded-2xl border border-black/10 bg-white p-4" /></label>
        <Button className="mt-5 w-full" loading={busy} onClick={() => void savePayments()}>Publish payment settings</Button>
      </Card>
      <Card elevated>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">Integration control</p>
        <h2 className="mt-3 font-display text-5xl text-[var(--color-deep-plum)]">Provider status</h2>
        <p className="mt-3 text-sm leading-7 text-gray-700">Admin can change modes, public IDs and provider status here. Private secret keys are never exposed in browser or Firestore; they stay in Vercel/Firebase environment variables.</p>
        {([['razorpayPublicKey','Razorpay public key'],['emailProvider','Email provider'],['shippingProvider','Shipping provider']] as const).map(([key,label]) => <label key={key} className="mt-4 grid gap-2 text-sm font-semibold">{label}<input value={String(integrations[key])} onChange={(event) => setIntegrations((current) => ({ ...current, [key]: event.target.value }))} className="rounded-2xl border border-black/10 bg-white px-4 py-3" /></label>)}
        <div className="mt-4 grid gap-3">{([['razorpayConfigured','Razorpay configured'],['googleSignInConfigured','Google Sign-In configured'],['appleSignInConfigured','Apple Sign-In configured']] as const).map(([key,label]) => <label key={key} className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm font-semibold"><input type="checkbox" checked={Boolean(integrations[key])} onChange={(event) => setIntegrations((current) => ({ ...current, [key]: event.target.checked }))} />{label}</label>)}</div>
        <label className="mt-4 grid gap-2 text-sm font-semibold">Admin notes<textarea value={integrations.notes} onChange={(event) => setIntegrations((current) => ({ ...current, notes: event.target.value }))} className="min-h-32 rounded-2xl border border-black/10 bg-white p-4" /></label>
        <Button className="mt-5 w-full" loading={busy} onClick={() => void saveIntegrations()}>Save integration status</Button>
      </Card>
      {message ? <p className="lg:col-span-2 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm">{message}</p> : null}
    </div>;
  }

  return <Card elevated>
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">Live CMS</p>
    <h2 className="mt-3 font-display text-5xl text-[var(--color-deep-plum)]">Control words, sections, videos and navigation</h2>
    <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-700">Edit visible text, links and section order directly. No code or JSON is required.</p>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row"><input value={cmsDocumentId} onChange={(event) => setCmsDocumentId(event.target.value)} placeholder="homepage, navigation, footer, policies" className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3" /><Button variant="outline" loading={busy} onClick={() => void loadCms()}>Load CMS document</Button></div>
    <div className="mt-6 grid gap-4">
      {cmsBlocks.map((block, index) => (
        <section key={block.id} className="rounded-[1.4rem] border border-black/10 bg-white/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--color-dusty-rose)]">Section {index + 1}</p><h3 className="mt-1 font-display text-3xl text-[var(--color-deep-plum)]">{block.type}</h3></div>
            <div className="flex gap-2">
              <button type="button" disabled={index === 0} onClick={() => setCmsBlocks((current) => { const next=[...current]; [next[index-1],next[index]]=[next[index],next[index-1]]; return next; })} className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white disabled:opacity-30" aria-label="Move section up">↑</button>
              <button type="button" disabled={index === cmsBlocks.length - 1} onClick={() => setCmsBlocks((current) => { const next=[...current]; [next[index+1],next[index]]=[next[index],next[index+1]]; return next; })} className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white disabled:opacity-30" aria-label="Move section down">↓</button>
              <label className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-xs font-semibold"><input type="checkbox" checked={block.enabled} onChange={(event) => setCmsBlocks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: event.target.checked } : item))} />Visible</label>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Object.entries(block.data).map(([key, rawValue]) => {
              const value = Array.isArray(rawValue) ? rawValue.join("\n") : String(rawValue ?? "");
              const multiline = value.length > 90 || Array.isArray(rawValue);
              return <label key={key} className={`grid gap-2 text-sm font-semibold ${multiline ? "sm:col-span-2" : ""}`}><span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>{multiline ? <textarea value={value} onChange={(event) => setCmsBlocks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, data: { ...item.data, [key]: Array.isArray(rawValue) ? event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) : event.target.value } } : item))} className="min-h-28 rounded-2xl border border-black/10 bg-white p-4 font-normal" /> : <input value={value} onChange={(event) => setCmsBlocks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, data: { ...item.data, [key]: typeof rawValue === "number" ? Number(event.target.value) : event.target.value } } : item))} className="rounded-2xl border border-black/10 bg-white px-4 py-3 font-normal" />}</label>;
            })}
          </div>
          <Button variant="danger" className="mt-5" onClick={() => setCmsBlocks((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove section</Button>
        </section>
      ))}
      <Button variant="outline" onClick={() => setCmsBlocks((current) => [...current, { id: `editorial-${Date.now()}`, type: "Editorial", enabled: true, order: current.length + 1, data: { title: "New section", body: "Add your content here" } }])}>Add new section</Button>
    </div>
    {message ? <p className="mt-4 rounded-2xl bg-white/70 p-4 text-sm">{message}</p> : null}
    <Button className="mt-5" loading={busy} onClick={() => void saveCms()}>Publish CMS document</Button>
  </Card>;
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumLoader } from "@/components/ui/PremiumLoader";
import { getSellerKycSettings } from "@/services/businessConfigurationService";
import { getSellerVerification, submitSellerVerification, uploadSellerKycDocument } from "@/services/sellerVerificationService";
import type { SellerKycSettings, SellerVerification } from "@/types/logistics";

const blankAddress = { name: "", phone: "", email: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India" as const };

export function SellerVerificationManager({ studioId, sellerUid }: { readonly studioId: string; readonly sellerUid: string }): React.JSX.Element {
  const [settings, setSettings] = useState<SellerKycSettings | null>(null);
  const [existing, setExisting] = useState<SellerVerification | null>(null);
  const [legalName, setLegalName] = useState("");
  const [panLastFour, setPanLastFour] = useState("");
  const [identityProofType, setIdentityProofType] = useState<"aadhaar" | "voterId" | "passport">("aadhaar");
  const [identityProofLastFour, setIdentityProofLastFour] = useState("");
  const [pickupAddress, setPickupAddress] = useState(blankAddress);
  const [bankAccountLastFour, setBankAccountLastFour] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [documents, setDocuments] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    void Promise.all([getSellerKycSettings(), getSellerVerification(studioId)])
      .then(([nextSettings, verification]) => {
        setSettings(nextSettings); setExisting(verification);
        if (verification) {
          setLegalName(verification.legalName);
          setPanLastFour(verification.panLastFour);
          setIdentityProofType(verification.identityProofType ?? "aadhaar");
          setIdentityProofLastFour(verification.identityProofLastFour);
          setPickupAddress(verification.pickupAddress);
          setBankAccountLastFour(verification.bankAccountLastFour);
          setIfsc(verification.ifsc);
          setDocuments([...verification.documentPaths]);
        }
      })
      .catch((caught) => setLoadError(caught instanceof Error ? caught.message : "Verification details could not load."))
      .finally(() => setLoading(false));
  }, [studioId]);

  if (loading) return <PremiumLoader label="Preparing secure Studio verification" />;
  if (!settings) return <Card elevated><p className="text-xs font-semibold uppercase tracking-[.2em] text-red-700">Verification could not load</p><p className="mt-3 text-sm leading-7 text-gray-700">{loadError || "Please check your connection and try again."}</p><Button className="mt-5" onClick={() => window.location.reload()}>Retry</Button></Card>;
  const locked = existing?.status === "verified";
  return <div className="grid gap-6">
    <Card elevated><p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">Sidra verification</p><h2 className="mt-3 font-display text-5xl text-[var(--color-deep-plum)]">{locked ? "Verified Studio" : "KYC & pickup address"}</h2><p className="mt-3 text-sm leading-7 text-gray-700">You submit details only to Sidra. Sidra sends Delhivery only the minimum pickup information needed for collection. Full Aadhaar or PAN values are never stored in plain text here.</p>{existing ? <p className="mt-4 rounded-2xl border border-black/10 bg-white p-4 text-sm">Current status: <strong>{existing.status}</strong>{existing.adminNote ? ` · ${existing.adminNote}` : ""}</p> : null}</Card>
    <Card elevated className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold">Legal name · required<input disabled={locked} value={legalName} onChange={(event) => setLegalName(event.target.value)} className="rounded-2xl border border-black/10 px-4 py-3" /></label>
      <label className="grid gap-2 text-sm font-semibold">PAN last 4 characters · {settings.requirePan ? "required" : "optional"}<input disabled={locked} maxLength={4} value={panLastFour} onChange={(event) => setPanLastFour(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} className="rounded-2xl border border-black/10 px-4 py-3" /></label>
      {settings.requireIdentityProof ? <>
        <label className="grid gap-2 text-sm font-semibold">Identity proof · required<select disabled={locked} value={identityProofType} onChange={(event) => setIdentityProofType(event.target.value as typeof identityProofType)} className="rounded-2xl border border-black/10 px-4 py-3">{settings.acceptedIdentityProofs.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">Identity proof last 4 · required<input disabled={locked} maxLength={4} value={identityProofLastFour} onChange={(event) => setIdentityProofLastFour(event.target.value.replace(/\W/g, ""))} className="rounded-2xl border border-black/10 px-4 py-3" /></label>
      </> : null}
      {settings.requirePickupAddress ? (["name","phone","email","line1","line2","city","state","postalCode"] as const).map((key) => <label key={key} className="grid gap-2 text-sm font-semibold capitalize">Pickup {key.replace(/([A-Z])/g, " $1")} · {key === "line2" ? "optional" : "required"}<input disabled={locked} value={pickupAddress[key]} onChange={(event) => setPickupAddress((current) => ({ ...current, [key]: event.target.value }))} className="rounded-2xl border border-black/10 px-4 py-3" /></label>) : null}
      {settings.requireBankDetails ? <>
        <label className="grid gap-2 text-sm font-semibold">Bank account last 4 · required<input disabled={locked} maxLength={4} value={bankAccountLastFour} onChange={(event) => setBankAccountLastFour(event.target.value.replace(/\D/g, ""))} className="rounded-2xl border border-black/10 px-4 py-3" /></label>
        <label className="grid gap-2 text-sm font-semibold">IFSC · required<input disabled={locked} value={ifsc} onChange={(event) => setIfsc(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} className="rounded-2xl border border-black/10 px-4 py-3" /></label>
      </> : <p className="rounded-2xl border border-black/10 bg-white p-4 text-sm leading-7 sm:col-span-2">Bank details are optional and are not required for KYC or courier pickup. At withdrawal time, choose UPI, bank transfer or IMPS and enter only the selected payout destination.</p>}
      {!locked && settings.requireIdentityProof ? <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Private verification document · required<input type="file" accept="image/*,application/pdf" multiple onChange={async (event) => { const files = [...(event.target.files ?? [])]; if (!files.length) return; setBusy(true); setMessage(""); try { const paths = await Promise.all(files.map((file) => uploadSellerKycDocument({ studioId, sellerUid, file }))); setDocuments((current) => [...current, ...paths]); setMessage(`${paths.length} private document${paths.length === 1 ? "" : "s"} uploaded.`); } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Upload failed."); } finally { setBusy(false); } }} className="rounded-2xl border border-black/10 bg-white px-4 py-3" /><span className="text-xs font-normal leading-6 text-black/55">Upload a masked Aadhaar, Voter ID or Passport image/PDF. You may also attach pickup-address proof. Hide full ID numbers and leave only the last four visible. Maximum 8 MB per file.</span></label> : null}
      <p className="text-xs text-black/55 sm:col-span-2">{documents.length} private document{documents.length === 1 ? "" : "s"} attached · stored in private Backblaze B2 paths.</p>
      {!locked ? <Button className="sm:col-span-2" loading={busy} onClick={async () => { setBusy(true); setMessage(""); try { if (legalName.trim().length < 2) throw new Error("Complete the seller legal name."); if (settings.requirePickupAddress && (pickupAddress.name.trim().length < 2 || pickupAddress.phone.trim().length < 10 || !pickupAddress.email.includes("@") || pickupAddress.line1.trim().length < 5 || pickupAddress.city.trim().length < 2 || pickupAddress.state.trim().length < 2 || pickupAddress.postalCode.trim().length !== 6)) throw new Error("Complete the required seller pickup address fields and 6-digit PIN code."); if (settings.requirePan && panLastFour.length !== 4) throw new Error("Enter the last 4 PAN characters."); if (settings.requireIdentityProof && identityProofLastFour.length !== 4) throw new Error("Enter the last 4 identity-proof characters."); if (documents.length === 0 && settings.requireIdentityProof) throw new Error("Upload at least one masked private identity document."); if (settings.requireBankDetails && (bankAccountLastFour.length !== 4 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc))) throw new Error("Complete the bank account last 4 digits and valid IFSC."); await submitSellerVerification({ studioId, sellerUid, legalName: legalName.trim(), panLastFour, identityProofType: settings.requireIdentityProof ? identityProofType : null, identityProofLastFour, pickupAddress, bankAccountLastFour, ifsc, documentPaths: documents }); setExisting(await getSellerVerification(studioId)); setMessage("Verification submitted. Sidra admin review is pending."); } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Verification could not be submitted."); } finally { setBusy(false); } }}>Submit verification</Button> : null}
      {message ? <p className="rounded-2xl border border-black/10 bg-white p-4 text-sm sm:col-span-2">{message}</p> : null}
    </Card>
  </div>;
}

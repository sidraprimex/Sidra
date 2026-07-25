import { PlatformContentManager } from "@/components/admin/PlatformContentManager";
import { listPlatformContent } from "@/services/founderAdminService";
import type { PlatformContentEntry } from "@/types/phase10-founder-admin";
export default async function Page(): Promise<React.JSX.Element> {
  let entries: PlatformContentEntry[] = []; try { entries = [...await listPlatformContent()]; } catch {}
  return <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8"><header className="mb-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Founder-managed language</p><h1 className="mt-3 font-heading text-5xl">Content controls</h1></header><PlatformContentManager initialEntries={entries} /></main>;
}

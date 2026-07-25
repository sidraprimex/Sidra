import { SearchExperience } from "@/components/search/SearchExperience";
export default async function SearchPage({ searchParams }: { readonly searchParams: Promise<{ q?: string }> }): Promise<React.JSX.Element> {
  const { q = "" } = await searchParams;
  return <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8"><SearchExperience initialQuery={q} /></main>;
}

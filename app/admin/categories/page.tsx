import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
export default function AdminCategoriesPage(): React.JSX.Element {
  return <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8"><TaxonomyManager kind="categories" /></main>;
}

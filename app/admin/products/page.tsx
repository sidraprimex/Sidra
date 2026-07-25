import { ProductModerationQueue } from "@/components/admin/ProductModerationQueue";
export default function AdminProductsPage(): React.JSX.Element {
  return <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8"><ProductModerationQueue reviewerId="current-founder" /></main>;
}

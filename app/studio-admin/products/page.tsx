import { ProductListManager } from "@/components/product-management/ProductListManager";
export default function StudioProductsPage(): React.JSX.Element {
  return <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8"><ProductListManager studioId="current-studio" /></main>;
}

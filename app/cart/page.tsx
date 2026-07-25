import { CartPageClient } from "@/components/cart/CartPageClient";
export default function CartPage(): React.JSX.Element {
  return <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8"><CartPageClient userId="current-customer" /></main>;
}

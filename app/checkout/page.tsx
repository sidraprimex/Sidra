import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
export default function CheckoutPage(): React.JSX.Element {
  return <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8"><CheckoutFlow userId="current-customer" /></main>;
}

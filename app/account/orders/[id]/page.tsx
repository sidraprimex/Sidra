import { notFound } from "next/navigation";
import { CustomerOrderDetail } from "@/components/orders/CustomerOrderDetail";
import { getOrderConfirmation } from "@/services/orderConfirmationService";

export default async function CustomerOrderDetailPage({ params }: { readonly params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  const order = await getOrderConfirmation(id);
  if (!order) notFound();
  return <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8"><CustomerOrderDetail order={order as never} /></main>;
}

import { CustomOrderDetailClient } from "@/components/custom-orders/CustomOrderDetailClient";

export default async function CustomerCustomOrderDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  const { id } = await params;
  return <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8"><CustomOrderDetailClient customOrderId={id} role="customer" /></main>;
}

import { ReviewSubmissionForm } from "@/components/customer/ReviewSubmissionForm";

export default async function NewReviewPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ orderId?: string; productId?: string }>;
}): Promise<React.JSX.Element> {
  const { orderId = "", productId = "" } = await searchParams;
  return <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8"><ReviewSubmissionForm orderId={orderId} productId={productId} /></main>;
}

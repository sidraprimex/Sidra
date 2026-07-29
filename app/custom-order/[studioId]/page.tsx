import { CustomOrderRequestForm } from "@/components/custom-orders/CustomOrderRequestForm";

export default async function CustomOrderRequestPage({
  params,
}: {
  readonly params: Promise<{ studioId: string }>;
}): Promise<React.JSX.Element> {
  const { studioId } = await params;
  return <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
    <header className="mb-10">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Made uniquely for you</p>
      <h1 className="mt-3 font-heading text-[clamp(3rem,8vw,6rem)]">Custom order request</h1>
      <p className="mt-4 max-w-3xl leading-7 text-muted">Share a complete brief. The Studio will review it and send a formal quote. Your private conversation opens only after Sidra verifies the payment.</p>
    </header>
    <CustomOrderRequestForm studioId={studioId} />
  </main>;
}

export default async function CustomOrderCheckoutReferencePage({
  params,
}: {
  readonly params: Promise<{ reference: string }>;
}): Promise<React.JSX.Element> {
  const { reference } = await params;
  return <main className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8">
    <section className="rounded-[var(--radius-lg)] border border-border bg-card p-8">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Secure custom-order payment</p>
      <h1 className="mt-3 font-heading text-4xl">Payment reference prepared</h1>
      <p className="mt-4 leading-7 text-muted">Reference: {reference}. The secure gateway session is server-owned and the final order will only be created after a verified payment webhook.</p>
      <a href="/checkout" className="mt-6 inline-flex rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white">Open secure checkout</a>
    </section>
  </main>;
}

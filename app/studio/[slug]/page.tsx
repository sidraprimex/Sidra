import { PublicStudioProfileClient } from "@/components/discovery/PublicStudioProfileClient";

export default async function PublicStudioPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ slug: string }>;
  readonly searchParams: Promise<{ collection?: string }>;
}): Promise<React.JSX.Element> {
  const { slug } = await params;
  const { collection = "all" } = await searchParams;

  return (
    <PublicStudioProfileClient
      slug={slug}
      initialCollectionId={collection}
    />
  );
}

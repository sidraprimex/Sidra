import { PublicStudioProfileClient } from "@/components/discovery/PublicStudioProfileClient";

export default async function PublicStudioPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<React.JSX.Element> {
  const { slug } = await params;
  return <PublicStudioProfileClient slug={slug} />;
}

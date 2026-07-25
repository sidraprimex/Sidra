import type { HomepageDocument } from "@/types/phase5-discovery";
import { BlockRenderer } from "@/components/homepage/BlockRenderer";

export function HomepageRenderer({ document }: { readonly document: HomepageDocument }): React.JSX.Element {
  const blocks = [...document.blocks].filter((block) => block.enabled).sort((a, b) => a.order - b.order);
  return <>{blocks.map((block) => <BlockRenderer key={block.id} block={block} />)}</>;
}

import type { HomepageBlock } from "@/types/phase5-discovery";
import { EditorialBlock, HeroBlock } from "@/components/homepage/blocks";

export function BlockRenderer({ block }: { readonly block: HomepageBlock }): React.JSX.Element | null {
  if (!block.enabled) return null;
  if (block.type === "Hero") return <HeroBlock block={block} />;
  return <EditorialBlock block={block} />;
}

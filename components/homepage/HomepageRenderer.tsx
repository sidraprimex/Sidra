import { BlockRenderer } from "@/components/homepage/BlockRenderer";
import type { HomepageExperienceData } from "@/services/homepageExperienceService";

interface HomepageRendererProps {
  readonly experience: HomepageExperienceData;
}

export function HomepageRenderer({
  experience,
}: HomepageRendererProps): React.JSX.Element {
  const blocks = [...experience.document.blocks]
    .filter((block) => block.enabled)
    .sort((first, second) => first.order - second.order);

  return (
    <>
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          experience={experience}
        />
      ))}
    </>
  );
}

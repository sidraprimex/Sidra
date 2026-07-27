import { BlockRenderer } from "@/components/homepage/BlockRenderer";
import { HomepageBackgroundSlideshow } from "@/components/homepage/HomepageBackgroundSlideshow";
import type { HomepageExperienceData } from "@/services/homepageExperienceService";

interface HomepageRendererProps {
  readonly experience: HomepageExperienceData;
}

export function HomepageRenderer({
  experience,
}: HomepageRendererProps): React.JSX.Element {
  const blocks = [...experience.document.blocks]
    .filter((block) => block.enabled)
    .sort(
      (first, second) =>
        first.order - second.order,
    );

  const heroBlock = blocks.find(
    (block) => block.type === "Hero",
  );

  const remainingBlocks = blocks.filter(
    (block) => block.type !== "Hero",
  );

  return (
    <>
      {heroBlock ? (
        <BlockRenderer
          block={heroBlock}
          experience={experience}
        />
      ) : null}

      <HomepageBackgroundSlideshow>
        {remainingBlocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            experience={experience}
          />
        ))}
      </HomepageBackgroundSlideshow>
    </>
  );
}

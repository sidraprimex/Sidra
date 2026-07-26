import {
  ArtistStoriesBlock,
  BestSellersBlock,
  CustomOrderBannerBlock,
  EditorialBlock,
  FeaturedCollectionsBlock,
  FeaturedStudiosBlock,
  HeroBlock,
  NewArrivalsBlock,
  SignatureCategoriesBlock,
  WhySidraBlock,
  JournalBlock,
  NewsletterBlock,
  TestimonialsBlock,
} from "@/components/homepage/blocks";
import type { HomepageExperienceData } from "@/services/homepageExperienceService";
import type { HomepageBlock } from "@/types/phase5-discovery";

interface BlockRendererProps {
  readonly block: HomepageBlock;
  readonly experience: HomepageExperienceData;
}

export function BlockRenderer({
  block,
  experience,
}: BlockRendererProps): React.JSX.Element | null {
  if (!block.enabled) {
    return null;
  }

  if (block.type === "Hero") {
    return <HeroBlock block={block} />;
  }

  if (block.type === "FeaturedStudios") {
    return (
      <FeaturedStudiosBlock
        block={block}
        studios={experience.studios}
      />
    );
  }

  if (block.type === "FeaturedCollections") {
    return (
      <FeaturedCollectionsBlock
        block={block}
        collections={experience.collections}
      />
    );
  }

  if (block.type === "SignatureCategories") {
    return (
      <SignatureCategoriesBlock
        block={block}
        categories={experience.categories}
      />
    );
  }

  if (block.type === "BestSellers") {
    return (
      <BestSellersBlock
        block={block}
        products={experience.products}
      />
    );
  }

  if (block.type === "NewArrivals") {
    return (
      <NewArrivalsBlock
        block={block}
        products={experience.products}
      />
    );
  }

  if (block.type === "CustomOrderBanner") {
    return <CustomOrderBannerBlock block={block} />;
  }

  if (block.type === "WhySidra") {
    return <WhySidraBlock block={block} />;
  }

  if (block.type === "ArtistStories") {
    return (
      <ArtistStoriesBlock
        block={block}
        studios={experience.studios}
      />
    );
  }

  if (block.type === "Journal") {
    return (
      <JournalBlock
        block={block}
        articles={experience.journal}
      />
    );
  }

  if (block.type === "Newsletter") {
    return <NewsletterBlock block={block} />;
  }

  if (block.type === "Testimonials") {
    return (
      <TestimonialsBlock
        block={block}
        reviews={experience.reviews}
      />
    );
  }

  return <EditorialBlock block={block} />;
}

import type { ReactNode } from "react";

interface JournalArticleBodyProps {
  readonly blocks: readonly Readonly<Record<string, unknown>>[];
  readonly fallbackText: string;
}

function readString(
  block: Readonly<Record<string, unknown>>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = block[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function readStringList(
  block: Readonly<Record<string, unknown>>,
  keys: readonly string[],
): readonly string[] {
  for (const key of keys) {
    const value = block[key];

    if (Array.isArray(value)) {
      return value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      );
    }
  }

  return [];
}

function safeBackgroundImage(url: string): string {
  const safeUrl = url.replace(/["\\\n\r]/g, "");
  return `url("${safeUrl}")`;
}

function renderBlock(
  block: Readonly<Record<string, unknown>>,
  index: number,
): ReactNode {
  const type =
    readString(block, ["type", "kind", "blockType"])?.toLowerCase() ??
    "paragraph";

  const text = readString(block, [
    "text",
    "content",
    "body",
    "value",
  ]);

  if (type === "heading" || type === "h2" || type === "h3") {
    if (!text) return null;

    const levelValue = block.level;
    const isLevelThree =
      levelValue === 3 ||
      levelValue === "3" ||
      type === "h3";

    if (isLevelThree) {
      return (
        <h3
          key={`heading-${index}`}
          className="mt-10 font-display text-[clamp(2rem,4vw,3.2rem)] leading-tight text-ivory-100"
        >
          {text}
        </h3>
      );
    }

    return (
      <h2
        key={`heading-${index}`}
        className="mt-14 font-display text-[clamp(2.8rem,6vw,5rem)] leading-[0.98] text-gold-100"
      >
        {text}
      </h2>
    );
  }

  if (type === "quote" || type === "blockquote") {
    if (!text) return null;

    const attribution = readString(block, [
      "attribution",
      "author",
      "source",
    ]);

    return (
      <blockquote
        key={`quote-${index}`}
        className="my-12 border-l border-gold-500/60 pl-6 sm:pl-10"
      >
        <p className="font-display text-[clamp(2.1rem,5vw,4rem)] leading-tight text-gold-100">
          “{text}”
        </p>

        {attribution ? (
          <footer className="mt-5 text-micro font-semibold uppercase tracking-[0.18em] text-gray-500">
            {attribution}
          </footer>
        ) : null}
      </blockquote>
    );
  }

  if (type === "image" || type === "photo") {
    const imageUrl = readString(block, [
      "url",
      "src",
      "imageUrl",
      "mediaUrl",
    ]);

    if (!imageUrl) return null;

    const altText =
      readString(block, ["alt", "altText"]) ??
      "Resin artistry featured in the Sidra Journal";

    const caption = readString(block, ["caption"]);

    return (
      <figure key={`image-${index}`} className="my-12">
        <div
          role="img"
          aria-label={altText}
          className="aspect-[16/10] w-full rounded-lg border border-gold-500/20 bg-charcoal-800 bg-cover bg-center shadow-modal"
          style={{
            backgroundImage: safeBackgroundImage(imageUrl),
          }}
        />

        {caption ? (
          <figcaption className="mt-4 text-micro uppercase tracking-[0.14em] text-gray-500">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (type === "video") {
    const videoUrl = readString(block, [
      "url",
      "src",
      "videoUrl",
      "mediaUrl",
    ]);

    if (!videoUrl) return null;

    const posterUrl = readString(block, [
      "poster",
      "posterUrl",
      "thumbnailUrl",
    ]);

    const caption = readString(block, ["caption"]);

    return (
      <figure
        key={`video-${index}`}
        className="my-12 overflow-hidden rounded-lg border border-gold-500/20 bg-black-950 shadow-modal"
      >
        <video
          className="aspect-video w-full object-cover"
          controls
          playsInline
          preload="metadata"
          poster={posterUrl ?? undefined}
        >
          <source src={videoUrl} />
          Your browser does not support this video.
        </video>

        {caption ? (
          <figcaption className="px-5 py-4 text-micro uppercase tracking-[0.14em] text-gray-500">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  if (
    type === "list" ||
    type === "bullet-list" ||
    type === "unordered-list"
  ) {
    const items = readStringList(block, [
      "items",
      "values",
      "content",
    ]);

    if (items.length === 0) return null;

    return (
      <ul
        key={`list-${index}`}
        className="my-8 space-y-3 pl-6 text-body-lg leading-8 text-gray-300"
      >
        {items.map((item, itemIndex) => (
          <li
            key={`${item}-${itemIndex}`}
            className="list-disc marker:text-gold-500"
          >
            {item}
          </li>
        ))}
      </ul>
    );
  }

  if (
    type === "numbered-list" ||
    type === "ordered-list"
  ) {
    const items = readStringList(block, [
      "items",
      "values",
      "content",
    ]);

    if (items.length === 0) return null;

    return (
      <ol
        key={`ordered-list-${index}`}
        className="my-8 space-y-3 pl-6 text-body-lg leading-8 text-gray-300"
      >
        {items.map((item, itemIndex) => (
          <li
            key={`${item}-${itemIndex}`}
            className="list-decimal marker:text-gold-500"
          >
            {item}
          </li>
        ))}
      </ol>
    );
  }

  if (type === "divider" || type === "separator") {
    return (
      <hr
        key={`divider-${index}`}
        className="my-14 border-0 border-t border-gold-500/20"
      />
    );
  }

  if (!text) return null;

  return (
    <p
      key={`paragraph-${index}`}
      className="mt-7 whitespace-pre-line text-body-lg leading-8 text-gray-300"
    >
      {text}
    </p>
  );
}

export function JournalArticleBody({
  blocks,
  fallbackText,
}: JournalArticleBodyProps): React.JSX.Element {
  if (blocks.length === 0) {
    return (
      <p className="text-body-lg leading-8 text-gray-300">
        {fallbackText}
      </p>
    );
  }

  return <div>{blocks.map(renderBlock)}</div>;
}

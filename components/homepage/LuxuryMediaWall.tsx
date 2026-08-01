"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import {
  useEffect,
  useState,
} from "react";
import { SIDRA_WALL_IMAGES } from "@/components/homepage/sidraMediaManifest";

const PREVIEW_LIMIT = 12;

export function LuxuryMediaWall({ images = [] }: { readonly images?: readonly string[] }): React.JSX.Element {
  const imagePool = images.length > 0 ? images : SIDRA_WALL_IMAGES;
  const previewImages =
    imagePool.slice(0, PREVIEW_LIMIT);

  const [selectedIndex, setSelectedIndex] =
    useState<number | null>(null);

  const [showAll, setShowAll] =
    useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const shouldLock =
      selectedIndex !== null || showAll;

    document.body.style.overflow =
      shouldLock ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedIndex, showAll]);

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent,
    ): void {
      if (event.key === "Escape") {
        setSelectedIndex(null);
        setShowAll(false);
      }

      if (selectedIndex === null) {
        return;
      }

      if (event.key === "ArrowRight") {
        setSelectedIndex(
          (selectedIndex + 1) %
            imagePool.length,
        );
      }

      if (event.key === "ArrowLeft") {
        setSelectedIndex(
          (selectedIndex -
            1 +
            imagePool.length) %
            imagePool.length,
        );
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [imagePool, selectedIndex]);

  const selectedImage =
    selectedIndex === null
      ? null
      : imagePool[selectedIndex];

  function openImage(src: string): void {
    const index = (
      imagePool as readonly string[]
    ).indexOf(src);

    if (index >= 0) {
      setSelectedIndex(index);
      setShowAll(false);
    }
  }

  function showPrevious(): void {
    if (selectedIndex === null) {
      return;
    }

    setSelectedIndex(
      (selectedIndex -
        1 +
        imagePool.length) %
        imagePool.length,
    );
  }

  function showNext(): void {
    if (selectedIndex === null) {
      return;
    }

    setSelectedIndex(
      (selectedIndex + 1) %
        imagePool.length,
    );
  }

  return (
    <>
      <section className="relative w-full min-w-0 overflow-hidden bg-[color:rgba(248,244,240,0.58)] px-4 py-16 text-[var(--color-deep-onyx)] backdrop-blur-[2px] sm:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[var(--color-deep-plum)]">
            Crafted in resin
          </p>

          <h2 className="mt-5 max-w-4xl break-words font-display text-[clamp(2.7rem,9vw,6.4rem)] leading-[0.9] text-[var(--color-deep-plum)]">
            A living wall of extraordinary craft.
          </h2>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-[color:rgba(28,28,28,0.7)] sm:text-lg">
            Preview selected resin artworks.
            Open any piece to explore the complete collection.
          </p>

          <div className="relative mt-10 overflow-hidden rounded-[1.8rem] border border-[color:rgba(213,189,159,0.42)] bg-[linear-gradient(145deg,rgba(59,30,53,0.98),rgba(28,28,28,0.98))] p-3 shadow-[0_28px_90px_rgba(59,30,53,0.2)] sm:p-5">
            <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {previewImages.map(
                (src, index) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() =>
                      openImage(src)
                    }
                    className={`group relative min-w-0 overflow-hidden rounded-[1.15rem] border border-white/10 bg-white/5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-champagne)] ${
                      index === 0 ||
                      index === 7
                        ? "col-span-2 aspect-[16/10]"
                        : "aspect-[4/5]"
                    }`}
                  >
                    <Image
                      src={src}
                      alt="Luxury resin artwork"
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition duration-1000 ease-[var(--ease-luxury)] group-hover:scale-[1.04]"
                    />

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_46%,rgba(28,28,28,0.82))]" />

                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 sm:p-4">
                      <span className="text-[0.58rem] font-semibold uppercase tracking-[0.17em] text-[var(--color-champagne)]">
                        View artwork
                      </span>

                      <span
                        aria-hidden="true"
                        className="text-lg text-white"
                      >
                        ↗
                      </span>
                    </div>
                  </button>
                ),
              )}
            </div>

            <div className="mt-6 flex justify-center pb-2">
              <button
                type="button"
                onClick={() =>
                  setShowAll(true)
                }
                className="inline-flex min-h-13 items-center justify-center rounded-full bg-[var(--color-champagne)] px-7 py-3 text-sm font-semibold text-[var(--color-deep-onyx)] transition duration-300 hover:bg-[var(--color-porcelain)]"
              >
                Explore All Art
                <span
                  className="ml-4"
                  aria-hidden="true"
                >
                  →
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {mounted && showAll ? createPortal(
        <div
          className="fixed inset-0 z-[280] overflow-y-auto overscroll-contain bg-[color:rgba(28,28,28,0.96)] px-3 py-3 backdrop-blur-xl sm:px-8 sm:py-5"
          role="dialog"
          aria-modal="true"
          aria-label="Explore all Sidra artwork"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[color:rgba(28,28,28,0.88)] py-4 backdrop-blur-xl">
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[var(--color-champagne)]">
                  Sidra collection
                </p>

                <h3 className="mt-1 font-display text-3xl text-[var(--color-porcelain)] sm:text-5xl">
                  Explore every artwork
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAll(false)
                }
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-xl text-white transition hover:bg-white/10"
                aria-label="Close gallery"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-6 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {imagePool.map(
                (src, index) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() =>
                      openImage(src)
                    }
                    className={`group relative overflow-hidden rounded-[1rem] border border-white/10 bg-white/5 ${
                      index % 11 === 0
                        ? "col-span-2 aspect-[16/10]"
                        : "aspect-[4/5]"
                    }`}
                  >
                    <Image
                      src={src}
                      alt="Sidra resin artwork"
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.035]"
                    />

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_58%,rgba(28,28,28,0.76))]" />

                    <span className="absolute bottom-3 left-3 text-[0.56rem] uppercase tracking-[0.16em] text-[var(--color-champagne)]">
                      Open art
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>, document.body
      ) : null}

      {mounted && selectedImage ? createPortal(
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden bg-[color:rgba(28,28,28,0.97)] p-2 backdrop-blur-xl sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Artwork viewer"
        >
          <button
            type="button"
            onClick={() =>
              setSelectedIndex(null)
            }
            className="absolute right-3 top-[max(.75rem,env(safe-area-inset-top))] z-20 flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-white/20 bg-black/60 text-2xl text-white backdrop-blur transition hover:bg-white/10 sm:right-8 sm:top-8"
            aria-label="Close artwork"
          >
            ×
          </button>

          <button
            type="button"
            onClick={showPrevious}
            className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex h-11 w-11 -translate-x-14 touch-manipulation items-center justify-center rounded-full border border-white/20 bg-black/60 text-2xl text-white backdrop-blur transition hover:bg-white/10 sm:bottom-auto sm:left-8 sm:h-12 sm:w-12 sm:translate-x-0"
            aria-label="Previous artwork"
          >
            ‹
          </button>

          <div className="relative h-[calc(100dvh-7rem)] w-full max-w-6xl overflow-hidden rounded-[1.1rem] border border-white/12 bg-black/30 shadow-2xl sm:h-[82svh] sm:rounded-[1.5rem]">
            <Image
              src={selectedImage}
              alt="Selected luxury resin artwork"
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-[linear-gradient(180deg,transparent,rgba(28,28,28,0.88))] px-5 pb-5 pt-16">
              <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[var(--color-champagne)]">
                Sidra resin artwork
              </p>

              <p className="text-xs text-white/65">
                {(selectedIndex ?? 0) + 1}
                {" / "}
                {imagePool.length}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={showNext}
            className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex h-11 w-11 translate-x-4 touch-manipulation items-center justify-center rounded-full border border-white/20 bg-black/60 text-2xl text-white backdrop-blur transition hover:bg-white/10 sm:bottom-auto sm:left-auto sm:right-8 sm:h-12 sm:w-12 sm:translate-x-0"
            aria-label="Next artwork"
          >
            ›
          </button>
        </div>, document.body
      ) : null}
    </>
  );
}

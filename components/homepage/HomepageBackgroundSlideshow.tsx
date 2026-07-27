"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { SIDRA_BACKGROUND_IMAGES } from "@/components/homepage/sidraMediaManifest";

interface HomepageBackgroundSlideshowProps {
  readonly children: ReactNode;
  readonly images?: readonly string[];
}

export function HomepageBackgroundSlideshow({
  children,
  images = [],
}: HomepageBackgroundSlideshowProps): React.JSX.Element {
  const imagePool = images.length > 0 ? images : SIDRA_BACKGROUND_IMAGES;
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const update = (): void => {
      setReducedMotion(query.matches);
    };

    update();
    query.addEventListener("change", update);

    return () => {
      query.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (
      reducedMotion ||
      imagePool.length < 2
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex(
        (current) =>
          (current + 1) %
          imagePool.length,
      );
    }, 6200);

    return () => {
      window.clearInterval(timer);
    };
  }, [imagePool, reducedMotion]);

  const activeImage =
    imagePool[
      activeIndex % Math.max(imagePool.length, 1)
    ] ?? "/media/sidra/homepage/322668.jpg";

  const motionPreset = activeIndex % 5;

  const target =
    motionPreset === 0
      ? { scale: 1.14, x: "2%", y: "-2%" }
      : motionPreset === 1
        ? { scale: 1.09, x: "-2%", y: "2%" }
        : motionPreset === 2
          ? { scale: 1.16, x: "1%", y: "1%" }
          : motionPreset === 3
            ? { scale: 1.11, x: "-1%", y: "-2%" }
            : { scale: 1.13, x: "2%", y: "2%" };

  return (
    <div className="relative isolate w-full min-w-0 overflow-hidden bg-[var(--color-deep-onyx)]">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.div
            key={activeImage}
            initial={{
              opacity: 0,
              scale: 1.02,
              x: 0,
              y: 0,
            }}
            animate={{
              opacity: 0.52,
              ...(reducedMotion
                ? { scale: 1, x: 0, y: 0 }
                : target),
            }}
            exit={{
              opacity: 0,
              scale: 1.04,
            }}
            transition={{
              opacity: {
                duration: 1.6,
                ease: "easeInOut",
              },
              scale: {
                duration: 9,
                ease: "easeInOut",
              },
              x: {
                duration: 9,
                ease: "easeInOut",
              },
              y: {
                duration: 9,
                ease: "easeInOut",
              },
            }}
            className="absolute inset-0"
          >
            <Image
              src={activeImage}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(28,28,28,0.34),rgba(59,30,53,0.22)_20%,rgba(28,28,28,0.16)_52%,rgba(59,30,53,0.24)_78%,rgba(28,28,28,0.38))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(217,167,176,0.2),transparent_27%),radial-gradient(circle_at_86%_62%,rgba(213,189,159,0.22),transparent_31%)]" />
      </div>

      <div className="relative z-10 min-w-0">
        {children}
      </div>
    </div>
  );
}

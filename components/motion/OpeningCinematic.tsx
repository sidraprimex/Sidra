"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export function OpeningCinematic(): React.JSX.Element | null {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;

    if (!root || !video) {
      return;
    }

    document.body.style.overflow = "hidden";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let closed = false;

    const close = (): void => {
      if (closed) {
        return;
      }

      closed = true;

      gsap.to(root, {
        opacity: 0,
        y: -10,
        duration: reducedMotion ? 0.2 : 0.7,
        ease: "power3.out",
        onComplete: () => {
          setVisible(false);
        },
      });
    };

    const hardTimeout = window.setTimeout(close, 11500);

    video.addEventListener("ended", close);

    void video.play().catch(() => {
      // autoplay blocked on some devices; user still sees video layer
    });

    return () => {
      window.clearTimeout(hardTimeout);
      video.removeEventListener("ended", close);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      document.body.style.overflow = "";
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] overflow-hidden bg-[var(--color-deep-onyx)]"
      aria-label="Sidra opening film"
    >
      <video
        ref={videoRef}
        className="h-full w-full object-contain bg-[var(--color-deep-onyx)]"
        src="/media/sidra/opening/sidra-opening.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        controls={false}
      />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(28,28,28,0.18),rgba(59,30,53,0.24)_42%,rgba(28,28,28,0.84))]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(213,189,159,0.18),transparent_58%)]" />

      <div className="absolute inset-x-0 bottom-0 flex justify-center px-4 pb-8 sm:px-8 sm:pb-10">
        <div className="w-full max-w-3xl rounded-[1.75rem] border border-white/10 bg-[color:rgba(28,28,28,0.34)] px-5 py-5 text-center text-[var(--color-porcelain)] backdrop-blur-md sm:px-8 sm:py-7">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.38em] text-[var(--color-champagne)]">
            Welcome to
          </p>

          <h1 className="mt-2 font-display text-[clamp(3rem,11vw,6rem)] leading-none tracking-[0.16em]">
            SIDRA
          </h1>

          <p className="mt-3 text-sm leading-7 text-white/76 sm:text-base">
            A marketplace of curated resin art, bespoke decor and quiet luxury.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          setVisible(false);
        }}
        className="absolute right-4 top-4 rounded-full border border-white/15 bg-[color:rgba(28,28,28,0.34)] px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-porcelain)] backdrop-blur-md sm:right-8 sm:top-8"
      >
        Skip
      </button>
    </div>
  );
}

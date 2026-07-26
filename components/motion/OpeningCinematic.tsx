"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { foundationContent } from "@/cms/foundationContent";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "sidra-opening-seen-v2";

type OpeningState =
  | "checking"
  | "visible"
  | "hidden";

interface NavigatorWithMemory extends Navigator {
  readonly deviceMemory?: number;
}

function openingWasSeen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberOpening(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
}

function detectLowPowerDevice(): boolean {
  const navigatorWithMemory =
    navigator as NavigatorWithMemory;

  const logicalProcessors =
    navigator.hardwareConcurrency ?? 8;

  const memory =
    navigatorWithMemory.deviceMemory ?? 8;

  return logicalProcessors <= 4 || memory <= 4;
}

function resolveFirstName(
  fullName: string | null | undefined,
  displayName: string | null | undefined,
  email: string | null | undefined,
): string | null {
  const candidate =
    fullName?.trim() ||
    displayName?.trim() ||
    email?.split("@")[0]?.trim();

  if (!candidate) {
    return null;
  }

  return candidate.split(/\s+/)[0] || null;
}

export function OpeningCinematic(): React.JSX.Element | null {
  const root = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const finishRef = useRef<() => void>(() => undefined);

  const [state, setState] =
    useState<OpeningState>("checking");

  const [skipReady, setSkipReady] =
    useState(false);

  const {
    loading,
    profile,
    user,
  } = useAuth();

  const firstName = useMemo(
    () =>
      resolveFirstName(
        profile?.fullName,
        user?.displayName,
        user?.email,
      ),
    [
      profile?.fullName,
      user?.displayName,
      user?.email,
    ],
  );

  useEffect(() => {
    if (loading || started.current) {
      return;
    }

    started.current = true;

    if (openingWasSeen()) {
      setState("hidden");
      return;
    }

    setState("visible");
  }, [loading]);

  useEffect(() => {
    if (state !== "visible") {
      return;
    }

    const node = root.current;

    if (!node) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const lowPower =
      reducedMotion || detectLowPowerDevice();

    const previousOverflow =
      document.documentElement.style.overflow;

    document.documentElement.style.overflow =
      "hidden";

    let closing = false;
    let canSkip = false;

    const animationContext = gsap.context(() => {
      if (lowPower) {
        gsap.set("[data-resin-shell]", {
          opacity: 1,
          scale: 1,
        });

        gsap.set("[data-reveal]", {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
        });

        gsap.set("[data-line]", {
          scaleX: 1,
        });

        gsap.set("[data-hint]", {
          opacity: 1,
        });

        gsap.to("[data-progress]", {
          scaleX: 1,
          duration: 1.45,
          ease: "none",
        });

        return;
      }

      const timeline = gsap.timeline({
        defaults: {
          ease: "power4.out",
        },
      });

      timeline
        .fromTo(
          "[data-resin-shell]",
          {
            opacity: 0,
            scale: 0.72,
            rotate: -8,
          },
          {
            opacity: 1,
            scale: 1,
            rotate: 0,
            duration: 1.5,
          },
          0,
        )
        .fromTo(
          "[data-brand]",
          {
            opacity: 0,
            letterSpacing: "0.72em",
          },
          {
            opacity: 1,
            letterSpacing: "0.32em",
            duration: 1,
          },
          0.1,
        )
        .fromTo(
          "[data-reveal]",
          {
            y: 34,
            opacity: 0,
            filter: "blur(15px)",
          },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 1.15,
            stagger: 0.14,
          },
          0.28,
        )
        .to(
          "[data-line]",
          {
            scaleX: 1,
            duration: 1.1,
            ease: "power3.inOut",
          },
          0.48,
        )
        .fromTo(
          "[data-hint]",
          {
            opacity: 0,
          },
          {
            opacity: 1,
            duration: 0.55,
          },
          1.45,
        );

      gsap.to("[data-resin-primary]", {
        xPercent: 9,
        yPercent: -7,
        rotate: 8,
        duration: 4.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to("[data-resin-secondary]", {
        xPercent: -8,
        yPercent: 10,
        rotate: -10,
        duration: 5.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to("[data-light-sweep]", {
        xPercent: 190,
        duration: 3.2,
        repeat: -1,
        repeatDelay: 0.35,
        ease: "power2.inOut",
      });

      gsap.to("[data-progress]", {
        scaleX: 1,
        duration: 3.5,
        ease: "none",
      });
    }, node);

    const finish = (): void => {
      if (closing) {
        return;
      }

      closing = true;
      rememberOpening();

      gsap.to(node, {
        autoAlpha: 0,
        scale: reducedMotion ? 1 : 1.015,
        duration: reducedMotion ? 0.2 : 0.7,
        ease: "power3.inOut",
        onComplete: () => {
          setState("hidden");
        },
      });
    };

    finishRef.current = finish;

    const unlockTimer = window.setTimeout(() => {
      canSkip = true;
      setSkipReady(true);
    }, lowPower ? 250 : 700);

    const completionTimer = window.setTimeout(
      finish,
      lowPower ? 1550 : 3600,
    );

    const handlePointer = (): void => {
      if (canSkip) {
        finish();
      }
    };

    const handleKeyboard = (
      event: KeyboardEvent,
    ): void => {
      if (
        canSkip &&
        (
          event.key === "Enter" ||
          event.key === " " ||
          event.key === "Escape"
        )
      ) {
        event.preventDefault();
        finish();
      }
    };

    window.addEventListener(
      "pointerdown",
      handlePointer,
    );

    window.addEventListener(
      "keydown",
      handleKeyboard,
    );

    return () => {
      window.clearTimeout(unlockTimer);
      window.clearTimeout(completionTimer);

      window.removeEventListener(
        "pointerdown",
        handlePointer,
      );

      window.removeEventListener(
        "keydown",
        handleKeyboard,
      );

      animationContext.revert();

      document.documentElement.style.overflow =
        previousOverflow;

      finishRef.current = () => undefined;
    };
  }, [state]);

  if (state === "hidden") {
    return null;
  }

  const greetingLineOne = firstName
    ? "Hello,"
    : foundationContent.opening.guestLineOne;

  const greetingLineTwo = firstName
    ? firstName
    : foundationContent.opening.guestLineTwo;

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Sidra opening experience"
      aria-live="polite"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black-950 text-ivory-100"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgba(214,180,111,.16), transparent 28%), radial-gradient(circle at 16% 84%, rgba(121,79,42,.14), transparent 34%), linear-gradient(145deg, #050505 0%, #15100b 48%, #030303 100%)",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <div
        data-resin-shell
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[31rem] w-[31rem] -translate-x-1/2 -translate-y-1/2 opacity-0 sm:h-[42rem] sm:w-[42rem]"
      >
        <div
          data-resin-primary
          className="absolute left-[8%] top-[4%] h-[72%] w-[72%] rounded-[44%_56%_62%_38%/43%_39%_61%_57%] border border-gold-100/20 bg-gradient-to-br from-gold-100/20 via-gold-500/8 to-transparent shadow-gold-glow backdrop-blur-xl"
        />

        <div
          data-resin-secondary
          className="absolute bottom-[3%] right-[2%] h-[58%] w-[58%] rounded-[63%_37%_46%_54%/42%_58%_42%_58%] border border-gold-500/15 bg-gradient-to-tr from-amber-900/15 via-gold-500/10 to-ivory-100/10 shadow-modal backdrop-blur-lg"
        />

        <div className="absolute inset-[17%] rounded-full border border-gold-500/15 shadow-[inset_0_0_70px_rgba(200,169,106,.09)]" />

        <div
          data-light-sweep
          className="absolute -left-[95%] top-[12%] h-[76%] w-[34%] -rotate-12 bg-gradient-to-r from-transparent via-ivory-100/15 to-transparent blur-2xl mix-blend-screen"
        />
      </div>

      <div className="relative z-10 w-full max-w-5xl px-5 text-center sm:px-8">
        <p
          data-brand
          className="text-micro font-semibold uppercase text-gold-500 opacity-0"
        >
          SIDRA
        </p>

        <p
          data-reveal
          className="mt-8 font-display text-[clamp(2.7rem,7vw,5.8rem)] leading-none text-gray-300 opacity-0"
        >
          {greetingLineOne}
        </p>

        <h1
          data-reveal
          className="mt-1 font-display text-[clamp(5.4rem,17vw,13rem)] leading-[0.72] tracking-[-0.055em] text-gold-100 opacity-0"
        >
          {greetingLineTwo}
        </h1>

        <p
          data-reveal
          className="mx-auto mt-8 max-w-xl text-caption leading-7 text-gray-400 opacity-0"
        >
          Resin, light and stories shaped into a
          quieter luxury marketplace.
        </p>

        <div
          data-line
          aria-hidden="true"
          className="mx-auto mt-8 h-px w-32 origin-center scale-x-0 bg-gradient-to-r from-transparent via-gold-500 to-transparent"
        />

        <div
          data-hint
          className="mt-6 opacity-0"
        >
          <p className="text-micro uppercase tracking-[0.2em] text-gray-500">
            Tap, press Enter, or continue automatically
          </p>

          <button
            type="button"
            disabled={!skipReady}
            onClick={(event) => {
              event.stopPropagation();
              finishRef.current();
            }}
            className={`mt-5 rounded-full border px-5 py-2 text-micro font-semibold uppercase tracking-[0.16em] transition duration-base ${
              skipReady
                ? "border-gold-500/35 text-gold-100 hover:border-gold-500 hover:bg-gold-500/10"
                : "cursor-wait border-white/10 text-gray-600"
            }`}
          >
            {skipReady
              ? "Skip opening"
              : "Preparing Sidra"}
          </button>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-white/5"
      >
        <div
          data-progress
          className="h-full origin-left scale-x-0 bg-gradient-to-r from-gold-500/20 via-gold-100 to-gold-500/20"
        />
      </div>
    </div>
  );
}

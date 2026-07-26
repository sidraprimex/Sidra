"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "@/hooks/useAuth";

interface SidraHeroExperienceProps {
  readonly eyebrow: string;
  readonly headline: string;
  readonly subhead: string;
  readonly primaryCtaLabel: string;
  readonly primaryCtaHref: string;
  readonly secondaryCtaLabel: string;
  readonly secondaryCtaHref: string;
}

interface NavigatorWithMemory extends Navigator {
  readonly deviceMemory?: number;
}

interface ResinOrb {
  readonly radiusRatio: number;
  readonly baseX: number;
  readonly baseY: number;
  readonly speed: number;
  readonly phase: number;
  readonly stretch: number;
  readonly opacity: number;
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

function safeInternalHref(
  value: string,
  fallback: string,
): string {
  return value.startsWith("/") ? value : fallback;
}

function isLowPowerDevice(): boolean {
  const memoryNavigator =
    navigator as NavigatorWithMemory;

  return (
    (navigator.hardwareConcurrency ?? 8) <= 4 ||
    (memoryNavigator.deviceMemory ?? 8) <= 4
  );
}

export function SidraHeroExperience({
  eyebrow,
  headline,
  subhead,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
}: SidraHeroExperienceProps): React.JSX.Element {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { loading, profile, user } = useAuth();

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
    const sectionNode = sectionRef.current;
    const canvasNode = canvasRef.current;

    if (!sectionNode || !canvasNode) {
      return;
    }

    const drawingContext = canvasNode.getContext("2d", {
      alpha: true,
    });

    if (!drawingContext) {
      return;
    }

    const canvasElement: HTMLCanvasElement =
      canvasNode;

    const context2D: CanvasRenderingContext2D =
      drawingContext;

    const sectionElement: HTMLElement =
      sectionNode;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const lowPower =
      reducedMotion || isLowPowerDevice();

    const pointer = {
      currentX: 0,
      currentY: 0,
      targetX: 0,
      targetY: 0,
    };

    const orbs: readonly ResinOrb[] = [
      {
        radiusRatio: 0.31,
        baseX: 0.67,
        baseY: 0.34,
        speed: 0.00032,
        phase: 0.2,
        stretch: 1.24,
        opacity: 0.2,
      },
      {
        radiusRatio: 0.25,
        baseX: 0.35,
        baseY: 0.62,
        speed: 0.00027,
        phase: 1.8,
        stretch: 0.82,
        opacity: 0.14,
      },
      {
        radiusRatio: 0.18,
        baseX: 0.78,
        baseY: 0.74,
        speed: 0.00039,
        phase: 3.1,
        stretch: 1.08,
        opacity: 0.12,
      },
      {
        radiusRatio: 0.14,
        baseX: 0.24,
        baseY: 0.26,
        speed: 0.00044,
        phase: 4.2,
        stretch: 1.35,
        opacity: 0.1,
      },
    ];

    let width = 1;
    let height = 1;
    let animationFrame = 0;
    let previousFrame = 0;

    function resizeCanvas(): void {
      const bounds = canvasElement.getBoundingClientRect();

      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);

      const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        lowPower ? 1.25 : 1.8,
      );

      canvasElement.width = Math.max(
        1,
        Math.floor(width * pixelRatio),
      );

      canvasElement.height = Math.max(
        1,
        Math.floor(height * pixelRatio),
      );

      context2D.setTransform(
        pixelRatio,
        0,
        0,
        pixelRatio,
        0,
        0,
      );
    }

    function drawResinOrb(
      orb: ResinOrb,
      timestamp: number,
      index: number,
    ): void {
      const minimumDimension = Math.min(
        width,
        height,
      );

      const radius =
        minimumDimension * orb.radiusRatio;

      const movementX =
        Math.sin(
          timestamp * orb.speed + orb.phase,
        ) *
        width *
        0.035;

      const movementY =
        Math.cos(
          timestamp * orb.speed * 0.82 +
            orb.phase,
        ) *
        height *
        0.045;

      const pointerStrength =
        index === 0 ? 34 : 18;

      const x =
        width * orb.baseX +
        movementX +
        pointer.currentX * pointerStrength;

      const y =
        height * orb.baseY +
        movementY +
        pointer.currentY * pointerStrength;

      const gradient =
        context2D.createRadialGradient(
          x - radius * 0.22,
          y - radius * 0.27,
          radius * 0.04,
          x,
          y,
          radius,
        );

      gradient.addColorStop(
        0,
        `rgba(255, 239, 203, ${orb.opacity * 1.7})`,
      );

      gradient.addColorStop(
        0.28,
        `rgba(218, 178, 101, ${orb.opacity})`,
      );

      gradient.addColorStop(
        0.66,
        `rgba(128, 79, 35, ${orb.opacity * 0.5})`,
      );

      gradient.addColorStop(
        1,
        "rgba(16, 10, 5, 0)",
      );

      context2D.save();
      context2D.translate(x, y);

      context2D.rotate(
        Math.sin(
          timestamp * orb.speed * 0.65 +
            orb.phase,
        ) * 0.24,
      );

      context2D.scale(
        orb.stretch,
        1 / orb.stretch,
      );

      context2D.translate(-x, -y);
      context2D.fillStyle = gradient;
      context2D.beginPath();
      context2D.arc(x, y, radius, 0, Math.PI * 2);
      context2D.fill();
      context2D.restore();

      context2D.save();
      context2D.globalAlpha = orb.opacity * 0.7;
      context2D.strokeStyle =
        "rgba(248, 223, 174, 0.32)";
      context2D.lineWidth = 1;
      context2D.beginPath();

      context2D.ellipse(
        x - radius * 0.08,
        y - radius * 0.1,
        radius * 0.62,
        radius * 0.42,
        Math.sin(
          timestamp * orb.speed +
            orb.phase,
        ) * 0.22,
        0,
        Math.PI * 2,
      );

      context2D.stroke();
      context2D.restore();
    }

    function render(timestamp: number): void {
      if (
        lowPower &&
        timestamp - previousFrame < 34
      ) {
        animationFrame =
          window.requestAnimationFrame(render);
        return;
      }

      previousFrame = timestamp;

      pointer.currentX +=
        (pointer.targetX - pointer.currentX) *
        0.045;

      pointer.currentY +=
        (pointer.targetY - pointer.currentY) *
        0.045;

      context2D.clearRect(0, 0, width, height);
      context2D.globalCompositeOperation = "screen";

      orbs.forEach((orb, index) => {
        drawResinOrb(
          orb,
          reducedMotion ? 0 : timestamp,
          index,
        );
      });

      context2D.globalCompositeOperation =
        "source-over";

      if (!reducedMotion) {
        animationFrame =
          window.requestAnimationFrame(render);
      }
    }

    function handlePointerMove(
      event: PointerEvent,
    ): void {
      const bounds =
        sectionElement.getBoundingClientRect();

      pointer.targetX =
        ((event.clientX - bounds.left) /
          bounds.width -
          0.5) *
        2;

      pointer.targetY =
        ((event.clientY - bounds.top) /
          bounds.height -
          0.5) *
        2;
    }

    function resetPointer(): void {
      pointer.targetX = 0;
      pointer.targetY = 0;
    }

    resizeCanvas();

    const resizeObserver = new ResizeObserver(
      resizeCanvas,
    );

    resizeObserver.observe(canvasElement);

    sectionElement.addEventListener(
      "pointermove",
      handlePointerMove,
      {
        passive: true,
      },
    );

    sectionElement.addEventListener(
      "pointerleave",
      resetPointer,
    );

    if (reducedMotion) {
      render(0);
    } else {
      animationFrame =
        window.requestAnimationFrame(render);
    }

    return () => {
      resizeObserver.disconnect();

      window.cancelAnimationFrame(
        animationFrame,
      );

      sectionElement.removeEventListener(
        "pointermove",
        handlePointerMove,
      );

      sectionElement.removeEventListener(
        "pointerleave",
        resetPointer,
      );
    };
  }, []);

  const greeting =
    !loading && firstName
      ? `Hello, ${firstName}`
      : eyebrow;

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[94svh] items-end overflow-hidden bg-black-950 px-5 pb-16 pt-32 text-ivory-100 sm:px-8 sm:pb-20 lg:px-14 lg:pb-24"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_74%_30%,rgba(200,169,106,0.09),transparent_35%),linear-gradient(180deg,rgba(3,3,3,0.14),rgba(3,3,3,0.4)_48%,rgba(3,3,3,0.98))]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25 mix-blend-soft-light"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-[18rem] top-[8%] h-[42rem] w-[42rem] rounded-full border border-gold-500/10 shadow-[inset_0_0_100px_rgba(200,169,106,0.07)]"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
        <div>
          <p className="text-micro font-semibold uppercase tracking-[0.28em] text-gold-500">
            {greeting}
          </p>

          <h1 className="mt-6 max-w-6xl font-display text-[clamp(4.4rem,12vw,10rem)] leading-[0.76] tracking-[-0.055em] text-gold-100">
            {headline}
          </h1>

          <p className="mt-8 max-w-2xl text-body-lg leading-8 text-gray-300">
            {subhead}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={safeInternalHref(
                primaryCtaHref,
                "/studios",
              )}
              className="group inline-flex min-h-14 items-center justify-center gap-4 rounded-lg bg-gold-500 px-7 py-4 text-caption font-semibold text-black-950 shadow-gold-glow transition duration-slow ease-luxury hover:-translate-y-1 hover:bg-gold-100"
            >
              {primaryCtaLabel}

              <span
                aria-hidden="true"
                className="transition duration-base group-hover:translate-x-2"
              >
                →
              </span>
            </Link>

            <Link
              href={safeInternalHref(
                secondaryCtaHref,
                "/collections",
              )}
              className="inline-flex min-h-14 items-center justify-center rounded-lg border border-gold-500/45 bg-black-950/25 px-7 py-4 text-caption font-semibold text-gold-100 backdrop-blur-md transition duration-slow ease-luxury hover:-translate-y-1 hover:border-gold-500 hover:bg-gold-500/10"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>

        <aside className="hidden border-l border-gold-500/20 pl-7 lg:block">
          <p className="text-micro font-semibold uppercase tracking-[0.2em] text-gold-500">
            Sidra Digital Gallery
          </p>

          <p className="mt-4 text-caption leading-7 text-gray-300">
            A living resin environment shaped by
            light, movement and verified Studio
            stories.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-gold-500/50 to-transparent" />

            <span className="text-micro uppercase tracking-[0.16em] text-gray-500">
              Scroll
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}

"use client";

import { useEffect, type ReactNode } from "react";
import { watchRuntimeTheme } from "@/services/runtimeConfigService";

function hexToRgb(value: string): string | null {
  const normalized = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  return [0, 2, 4]
    .map((index) => Number.parseInt(normalized.slice(index, index + 2), 16))
    .join(" ");
}

export function RuntimeThemeProvider({ children }: { readonly children: ReactNode }) {
  useEffect(
    () =>
      watchRuntimeTheme((theme) => {
        const root = document.documentElement;
        const entries = [
          ["--color-deep-plum", theme.deepPlum],
          ["--color-dusty-rose", theme.dustyRose],
          ["--color-porcelain", theme.porcelain],
          ["--color-champagne", theme.champagne],
          ["--color-deep-onyx", theme.deepOnyx],
        ] as const;
        for (const [name, value] of entries) root.style.setProperty(name, value);
        for (const [name, value] of entries) {
          const rgb = hexToRgb(value);
          if (rgb) root.style.setProperty(`${name}-rgb`, rgb);
        }
        root.style.setProperty("--radius-lg", `${theme.cardRadiusRem}rem`);
      }),
    [],
  );

  return <>{children}</>;
}

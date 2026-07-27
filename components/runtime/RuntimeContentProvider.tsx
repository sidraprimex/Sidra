"use client";

import { useEffect, type ReactNode } from "react";
import {
  watchRuntimeTextOverrides,
  type RuntimeTextOverride,
} from "@/services/runtimeCmsService";

const originals = new WeakMap<Text, string>();

const ignoredTags = new Set([
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
  "INPUT",
  "OPTION",
  "CODE",
  "PRE",
]);

function applyOverrides(
  replacements: readonly RuntimeTextOverride[],
): void {
  const active = new Map(
    replacements
      .filter(
        (item) =>
          item.enabled !== false && item.from.trim(),
      )
      .map((item) => [item.from.trim(), item.to]),
  );

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
  );

  let current = walker.nextNode();

  while (current) {
    const node = current as Text;
    const parent = node.parentElement;

    if (
      parent &&
      !ignoredTags.has(parent.tagName) &&
      !parent.closest("[data-cms-ignore]")
    ) {
      const original =
        originals.get(node) ?? node.nodeValue ?? "";

      if (!originals.has(node)) {
        originals.set(node, original);
      }

      const replacement = active.get(original.trim());

      if (replacement !== undefined) {
        const leading =
          original.match(/^\s*/)?.[0] ?? "";
        const trailing =
          original.match(/\s*$/)?.[0] ?? "";

        node.nodeValue =
          `${leading}${replacement}${trailing}`;
      } else if (node.nodeValue !== original) {
        node.nodeValue = original;
      }
    }

    current = walker.nextNode();
  }
}

export function RuntimeContentProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  useEffect(() => {
    let replacements: readonly RuntimeTextOverride[] = [];
    let scheduled = false;

    const schedule = () => {
      if (scheduled) return;

      scheduled = true;

      window.requestAnimationFrame(() => {
        scheduled = false;
        applyOverrides(replacements);
      });
    };

    const observer = new MutationObserver(schedule);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const unsubscribe = watchRuntimeTextOverrides(
      (values) => {
        replacements = values;
        schedule();
      },
      () => {
        replacements = [];
        schedule();
      },
    );

    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, []);

  return <>{children}</>;
}

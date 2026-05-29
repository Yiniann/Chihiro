"use client";

import { useMemo } from "react";
import { useWindowSize } from "@/hooks/use-window-size";

const BREAKPOINTS = [
  { label: "base", minWidth: 0 },
  { label: "sm", minWidth: 640 },
  { label: "md", minWidth: 768 },
  { label: "lg", minWidth: 1024 },
  { label: "xl", minWidth: 1280 },
  { label: "2xl", minWidth: 1536 },
] as const;

function getActiveBreakpoint(width: number) {
  for (let index = BREAKPOINTS.length - 1; index >= 0; index -= 1) {
    const breakpoint = BREAKPOINTS[index];

    if (width >= breakpoint.minWidth) {
      return breakpoint.label;
    }
  }

  return BREAKPOINTS[0].label;
}

export function DevBreakpointIndicator() {
  const { width } = useWindowSize();
  const activeBreakpoint = useMemo(() => getActiveBreakpoint(width), [width]);

  if (process.env.NODE_ENV === "production" || width <= 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-[120] border-r border-t border-zinc-900/10 bg-white/88 px-2 py-1.5 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-zinc-700 shadow-[0_-1px_0_rgba(255,255,255,0.35),8px_-8px_24px_rgba(15,23,42,0.1)] backdrop-blur-md dark:border-white/12 dark:bg-zinc-950/78 dark:text-zinc-200 dark:shadow-[0_-1px_0_rgba(255,255,255,0.04),8px_-8px_24px_rgba(0,0,0,0.32)]">
      <div className="flex items-center gap-1.5">
        <span className="inline-flex h-1.5 w-1.5 bg-emerald-500" aria-hidden="true" />
        <span>{activeBreakpoint}</span>
        <span className="text-zinc-400 dark:text-zinc-500">/</span>
        <span>{Math.round(width)}px</span>
      </div>
    </div>
  );
}

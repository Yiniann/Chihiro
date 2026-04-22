"use client";

import { useLinkStatus } from "next/link";

type NavigationPendingIndicatorProps = {
  variant?: "nav" | "inline";
};

export function NavigationPendingIndicator({
  variant = "nav",
}: NavigationPendingIndicatorProps) {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={[
        "inline-flex shrink-0 rounded-full bg-current transition-all duration-200",
        "delay-150",
        variant === "nav" ? "ml-2 h-1.5 w-1.5" : "h-1.5 w-1.5",
        pending ? "scale-100 opacity-70 animate-pulse" : "scale-75 opacity-0",
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

"use client";

import type { ReactNode } from "react";

type ScrollToSectionLinkProps = {
  targetId: string;
  ariaLabel: string;
  className?: string;
  children: ReactNode;
};

export function ScrollToSectionLink({
  targetId,
  ariaLabel,
  className,
  children,
}: ScrollToSectionLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      aria-label={ariaLabel}
      className={className}
      onClick={(event) => {
        event.preventDefault();

        const target = document.getElementById(targetId);
        if (!target) {
          return;
        }

        target.scrollIntoView({ behavior: "smooth", block: "start" });

        if (window.location.hash !== `#${targetId}`) {
          window.history.replaceState(null, "", `#${targetId}`);
        }
      }}
    >
      {children}
    </a>
  );
}

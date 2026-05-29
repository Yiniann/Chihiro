"use client";

import { useLayoutEffect } from "react";
import { applyStoredThemeMode } from "@/lib/theme-mode";

export function ThemeModeInit() {
  useLayoutEffect(() => {
    applyStoredThemeMode();

    const frame = window.requestAnimationFrame(() => {
      document.documentElement.dataset.themeTransitionReady = "true";
    });

    return () => {
      window.cancelAnimationFrame(frame);
      delete document.documentElement.dataset.themeTransitionReady;
    };
  }, []);

  return null;
}

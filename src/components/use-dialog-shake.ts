"use client";

import { useCallback } from "react";
import { useAnimationControls } from "framer-motion";

export function useDialogShake() {
  const shakeControls = useAnimationControls();

  const triggerShake = useCallback(() => {
    void shakeControls.start({
      x: [0, -10, 10, -7, 7, -4, 4, 0],
      transition: {
        duration: 0.36,
        ease: "easeOut",
      },
    });
  }, [shakeControls]);

  return {
    shakeControls,
    triggerShake,
  };
}

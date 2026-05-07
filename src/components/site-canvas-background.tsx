"use client";

import { useEffect, useRef } from "react";

function parseRgbTriplet(value: string, fallback: [number, number, number]) {
  const parts = value
    .trim()
    .split(/\s+/)
    .map((part) => Number(part));

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return fallback;
  }

  return parts as [number, number, number];
}

function rgba(rgb: [number, number, number], alpha: number) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export function SiteCanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    let noisePattern: CanvasPattern | null = null;
    let lastTheme = "";

    const buildNoisePattern = (theme: string) => {
      const tile = document.createElement("canvas");
      tile.width = 220;
      tile.height = 220;
      const tileContext = tile.getContext("2d");

      if (!tileContext) {
        return null;
      }

      const imageData = tileContext.createImageData(tile.width, tile.height);
      const data = imageData.data;
      const alphaBase = theme === "dark" ? 10 : 12;

      for (let index = 0; index < data.length; index += 4) {
        const noise =
          theme === "dark"
            ? 210 + Math.floor(Math.random() * 36)
            : 150 + Math.floor(Math.random() * 46);
        data[index] = noise;
        data[index + 1] = noise;
        data[index + 2] = noise;
        data[index + 3] = alphaBase;
      }

      tileContext.putImageData(imageData, 0, 0);
      return context.createPattern(tile, "repeat");
    };

    const draw = () => {
      const styles = getComputedStyle(document.documentElement);
      const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const background = parseRgbTriplet(
        styles.getPropertyValue("--background-rgb"),
        theme === "dark" ? [9, 9, 11] : [250, 250, 250],
      );
      const backgroundTint = parseRgbTriplet(
        styles.getPropertyValue("--background-tint-rgb"),
        theme === "dark" ? [12, 14, 20] : [248, 250, 252],
      );
      const primary = parseRgbTriplet(
        styles.getPropertyValue("--primary-rgb"),
        theme === "dark" ? [56, 189, 248] : [94, 129, 172],
      );

      const linearGradient = context.createLinearGradient(0, 0, 0, height);
      linearGradient.addColorStop(0, rgba(background, theme === "dark" ? 0.98 : 0.96));
      linearGradient.addColorStop(1, rgba(backgroundTint, theme === "dark" ? 0.96 : 0.92));
      context.fillStyle = linearGradient;
      context.fillRect(0, 0, width, height);

      const topGlow = context.createRadialGradient(
        width / 2,
        0,
        0,
        width / 2,
        0,
        width * 0.42,
      );
      topGlow.addColorStop(0, rgba(primary, theme === "dark" ? 0.16 : 0.14));
      topGlow.addColorStop(1, rgba(primary, 0));
      context.fillStyle = topGlow;
      context.fillRect(0, 0, width, height);

      const bottomGlow = context.createRadialGradient(
        width / 2,
        height,
        0,
        width / 2,
        height,
        width * 0.5,
      );
      bottomGlow.addColorStop(0, rgba(primary, theme === "dark" ? 0.1 : 0.12));
      bottomGlow.addColorStop(1, rgba(primary, 0));
      context.fillStyle = bottomGlow;
      context.fillRect(0, 0, width, height);

      if (!noisePattern || lastTheme !== theme) {
        noisePattern = buildNoisePattern(theme);
        lastTheme = theme;
      }

      if (noisePattern) {
        context.save();
        context.globalAlpha = theme === "dark" ? 0.08 : 0.1;
        context.globalCompositeOperation = theme === "dark" ? "screen" : "multiply";
        context.filter = "blur(0.35px)";
        context.fillStyle = noisePattern;
        context.fillRect(0, 0, width, height);
        context.restore();
      }
    };

    draw();

    const resizeObserver = () => draw();
    const mutationObserver = new MutationObserver(() => draw());

    window.addEventListener("resize", resizeObserver);
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style", "class"],
    });

    return () => {
      window.removeEventListener("resize", resizeObserver);
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}

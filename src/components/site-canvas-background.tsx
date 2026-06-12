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

function mixRgb(
  first: [number, number, number],
  second: [number, number, number],
  ratio: number,
): [number, number, number] {
  const clampedRatio = Math.max(0, Math.min(1, ratio));

  return [
    Math.round(first[0] * (1 - clampedRatio) + second[0] * clampedRatio),
    Math.round(first[1] * (1 - clampedRatio) + second[1] * clampedRatio),
    Math.round(first[2] * (1 - clampedRatio) + second[2] * clampedRatio),
  ];
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
    let stableMobileLayoutHeight = 0;

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
      const isMobile = width < 640;
      const layoutHeight = isMobile
        ? (stableMobileLayoutHeight = Math.max(stableMobileLayoutHeight, height))
        : height;

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
      const coolGlow = mixRgb(
        primary,
        theme === "dark" ? [132, 206, 255] : [172, 196, 236],
        0.38,
      );
      const mistGlow = mixRgb(
        primary,
        theme === "dark" ? [94, 158, 224] : [196, 214, 244],
        0.55,
      );
      const softGlow = mixRgb(
        primary,
        theme === "dark" ? [112, 178, 240] : [184, 206, 240],
        0.46,
      );
      const denseMobileGlow = mixRgb(
        primary,
        theme === "dark" ? [112, 172, 236] : [176, 202, 238],
        0.4,
      );
      const airyMobileGlow = mixRgb(
        primary,
        theme === "dark" ? [132, 190, 248] : [188, 212, 244],
        0.46,
      );

      const linearGradient = context.createLinearGradient(0, 0, 0, height);
      linearGradient.addColorStop(0, rgba(background, theme === "dark" ? 0.98 : 0.96));
      linearGradient.addColorStop(1, rgba(backgroundTint, theme === "dark" ? 0.96 : 0.92));
      context.fillStyle = linearGradient;
      context.fillRect(0, 0, width, height);

      const glowClusters = isMobile
        ? [
            {
              x: width * 0.22,
              y: layoutHeight * 0.3,
              radius: width * 0.36,
              alpha: theme === "dark" ? 0.075 : 0.085,
              color: denseMobileGlow,
              parts: [
                { offsetX: 0, offsetY: 0, radiusScale: 1, alphaScale: 1 },
                { offsetX: width * 0.06, offsetY: layoutHeight * 0.034, radiusScale: 0.86, alphaScale: 0.66 },
                { offsetX: width * -0.036, offsetY: layoutHeight * -0.02, radiusScale: 0.7, alphaScale: 0.48 },
              ],
            },
            {
              x: width * 0.7,
              y: layoutHeight * 0.68,
              radius: width * 0.38,
              alpha: theme === "dark" ? 0.062 : 0.072,
              color: airyMobileGlow,
              parts: [
                { offsetX: 0, offsetY: 0, radiusScale: 1, alphaScale: 1 },
                { offsetX: width * -0.058, offsetY: layoutHeight * -0.038, radiusScale: 0.82, alphaScale: 0.68 },
                { offsetX: width * 0.038, offsetY: layoutHeight * 0.026, radiusScale: 0.68, alphaScale: 0.48 },
              ],
            },
          ]
        : [
            {
              x: width * 0.22,
              y: height * 0.24,
              radius: width * 0.22,
              alpha: theme === "dark" ? 0.078 : 0.088,
              color: coolGlow,
              parts: [
                { offsetX: 0, offsetY: 0, radiusScale: 1, alphaScale: 1 },
                { offsetX: width * 0.046, offsetY: height * 0.026, radiusScale: 0.82, alphaScale: 0.72 },
                { offsetX: width * -0.03, offsetY: height * -0.018, radiusScale: 0.66, alphaScale: 0.54 },
              ],
            },
            {
              x: width * 0.68,
              y: height * 0.62,
              radius: width * 0.24,
              alpha: theme === "dark" ? 0.085 : 0.095,
              color: mistGlow,
              parts: [
                { offsetX: 0, offsetY: 0, radiusScale: 1, alphaScale: 1 },
                { offsetX: width * -0.05, offsetY: height * -0.034, radiusScale: 0.8, alphaScale: 0.72 },
                { offsetX: width * 0.034, offsetY: height * 0.024, radiusScale: 0.64, alphaScale: 0.52 },
              ],
            },
            {
              x: width * 0.18,
              y: height * 0.44,
              radius: width * 0.095,
              alpha: theme === "dark" ? 0.074 : 0.084,
              color: softGlow,
              parts: [
                { offsetX: 0, offsetY: 0, radiusScale: 1, alphaScale: 1 },
                { offsetX: width * 0.018, offsetY: height * 0.014, radiusScale: 0.7, alphaScale: 0.62 },
              ],
            },
            {
              x: width * 0.42,
              y: height * 0.36,
              radius: width * 0.11,
              alpha: theme === "dark" ? 0.08 : 0.09,
              color: coolGlow,
              parts: [
                { offsetX: 0, offsetY: 0, radiusScale: 1, alphaScale: 1 },
                { offsetX: width * -0.02, offsetY: height * 0.016, radiusScale: 0.72, alphaScale: 0.62 },
              ],
            },
            {
              x: width * 0.82,
              y: height * 0.38,
              radius: width * 0.09,
              alpha: theme === "dark" ? 0.068 : 0.078,
              color: mistGlow,
              parts: [
                { offsetX: 0, offsetY: 0, radiusScale: 1, alphaScale: 1 },
                { offsetX: width * -0.016, offsetY: height * 0.012, radiusScale: 0.68, alphaScale: 0.56 },
              ],
            },
            {
              x: width * 0.52,
              y: height * 0.76,
              radius: width * 0.1,
              alpha: theme === "dark" ? 0.066 : 0.076,
              color: softGlow,
              parts: [
                { offsetX: 0, offsetY: 0, radiusScale: 1, alphaScale: 1 },
                { offsetX: width * 0.016, offsetY: height * -0.014, radiusScale: 0.66, alphaScale: 0.56 },
              ],
            },
            {
              x: width * 0.72,
              y: height * 0.22,
              radius: width * 0.082,
              alpha: theme === "dark" ? 0.062 : 0.072,
              color: coolGlow,
              parts: [
                { offsetX: 0, offsetY: 0, radiusScale: 1, alphaScale: 1 },
                { offsetX: width * -0.014, offsetY: height * 0.01, radiusScale: 0.64, alphaScale: 0.54 },
              ],
            },
          ];

      for (const glow of glowClusters) {
        for (const part of glow.parts) {
          const centerX = glow.x + part.offsetX;
          const centerY = glow.y + part.offsetY;
          const radius = glow.radius * part.radiusScale;
          const ellipseScaleX = isMobile ? 1.18 : 1.26;
          const ellipseScaleY = isMobile ? 0.82 : 0.76;

          context.save();
          context.translate(centerX, centerY);
          context.scale(ellipseScaleX, ellipseScaleY);

          const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
          gradient.addColorStop(0, rgba(glow.color, glow.alpha * part.alphaScale));
          gradient.addColorStop(1, rgba(glow.color, 0));
          context.fillStyle = gradient;
          context.fillRect(-radius, -radius, radius * 2, radius * 2);
          context.restore();
        }
      }

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

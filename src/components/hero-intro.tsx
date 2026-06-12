"use client";

import { Fragment, useEffect, useState } from "react";
import {
  splitHeroIntroParagraphs,
  tokenizeHeroIntro,
  type HeroIntroToken,
} from "@/lib/hero-copy";

type HeroIntroProps = {
  intro: string;
  authorName: string;
};

export function HeroIntro({ intro, authorName }: HeroIntroProps) {
  const paragraphs = splitHeroIntroParagraphs(intro);

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <>
      {paragraphs.map((paragraph, index) => {
        const tokens = tokenizeHeroIntro(paragraph);
        const marginClass = index === 0 ? "mt-6" : "mt-3";

        return (
          <p
            key={index}
            className={`hero-copy-body reading-copy site-lead ${marginClass} text-zinc-600 dark:text-zinc-300`}
          >
            {tokens.map((token, tokenIndex) => (
              <HeroIntroTokenNode key={tokenIndex} token={token} authorName={authorName} />
            ))}
          </p>
        );
      })}
    </>
  );
}

function HeroIntroTokenNode({
  token,
  authorName,
}: {
  token: HeroIntroToken;
  authorName: string;
}) {
  if (token.type === "text") {
    return <Fragment>{token.value}</Fragment>;
  }

  if (token.type === "author") {
    return <Fragment>{authorName}</Fragment>;
  }

  if (token.type === "code") {
    return <HeroTypewriter text={token.value} />;
  }

  if (token.type === "emphasis") {
    return (
      <span className="hero-copy-emphasis font-medium italic text-zinc-900 dark:text-zinc-100">
        {token.value}
      </span>
    );
  }

  return null;
}

function HeroTypewriter({ text }: { text: string }) {
  const displayText = addTypewriterVisualSpacing(text);
  const [visibleCount, setVisibleCount] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      const frame = window.requestAnimationFrame(() => {
        setVisibleCount(displayText.length);
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    const startDelayMs = 950;
    const totalDurationMs = 1350;
    const stepDurationMs = Math.max(
      Math.floor(totalDurationMs / Math.max(displayText.length, 1)),
      28,
    );
    const resetFrame = window.requestAnimationFrame(() => {
      setVisibleCount(0);
    });
    let interval: number | null = null;

    const startTimer = window.setTimeout(() => {
      setVisibleCount(1);

      if (displayText.length <= 1) {
        return;
      }

      interval = window.setInterval(() => {
        setVisibleCount((current) => {
          if (current >= displayText.length) {
            if (interval !== null) {
              window.clearInterval(interval);
            }
            return current;
          }

          return current + 1;
        });
      }, stepDurationMs);
    }, startDelayMs);

    return () => {
      window.cancelAnimationFrame(resetFrame);
      window.clearTimeout(startTimer);
      if (interval !== null) {
        window.clearInterval(interval);
      }
    };
  }, [displayText, prefersReducedMotion]);

  const visibleText = displayText.slice(0, visibleCount);
  const isComplete = visibleCount >= displayText.length;

  return (
    <span className="hero-copy-typewriter font-mono text-[0.95em] text-primary" aria-label={text}>
      <span className="hero-copy-typewriter-ghost" aria-hidden="true">
        {displayText}
      </span>
      <span className="hero-copy-typewriter-text" aria-hidden="true">
        {visibleText}
        {!prefersReducedMotion && !isComplete ? (
          <span className="hero-copy-typewriter-caret">_</span>
        ) : null}
      </span>
    </span>
  );
}

function addTypewriterVisualSpacing(text: string) {
  return text.replace(/\/>/g, "/\u2009>");
}

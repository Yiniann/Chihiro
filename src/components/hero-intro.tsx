import { Fragment } from "react";
import type { CSSProperties } from "react";
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
            className={`hero-copy-body reading-copy ${marginClass} text-lg leading-9 text-zinc-600 dark:text-zinc-300 sm:text-xl`}
          >
            {tokens.map((token, tokenIndex) => (
              <HeroIntroTokenNode
                key={tokenIndex}
                token={token}
                authorName={authorName}
              />
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
  const style = {
    "--hero-typewriter-steps": String(Math.max(text.length, 1)),
  } as CSSProperties;

  const nodes = renderTypewriterContent(text);

  return (
    <span
      className="hero-copy-typewriter font-mono text-[0.95em] text-primary"
      aria-label={text}
      style={style}
    >
      <span className="hero-copy-typewriter-ghost" aria-hidden="true">
        {nodes}
      </span>
      <span className="hero-copy-typewriter-text" aria-hidden="true">
        {nodes}
      </span>
    </span>
  );
}

function renderTypewriterContent(text: string) {
  const parts: Array<string | { key: string; value: string }> = [];
  let buffer = "";

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const previous = text[index - 1];

    if (char === ">" && previous === "/") {
      if (buffer) {
        parts.push(buffer);
        buffer = "";
      }
      parts.push({ key: `gap-${index}`, value: char });
      continue;
    }

    buffer += char;
  }

  if (buffer) {
    parts.push(buffer);
  }

  return parts.map((part, index) => {
    if (typeof part === "string") {
      return <Fragment key={`t-${index}`}>{part}</Fragment>;
    }

    return (
      <span key={part.key} style={{ marginLeft: "0.08ch" }}>
        {part.value}
      </span>
    );
  });
}

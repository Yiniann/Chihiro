export const DEFAULT_HERO_INTRO =
  "Hi, I'm {author}, an interest-driven `<Developer />`\n**builder and writer** exploring products, technology, and personal expression.";

export type HeroIntroToken =
  | { type: "text"; value: string }
  | { type: "author" }
  | { type: "code"; value: string }
  | { type: "emphasis"; value: string };

const HERO_INTRO_TOKEN_PATTERN = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\{author\})/g;

export function tokenizeHeroIntro(raw: string): HeroIntroToken[] {
  const tokens: HeroIntroToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  HERO_INTRO_TOKEN_PATTERN.lastIndex = 0;

  while ((match = HERO_INTRO_TOKEN_PATTERN.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: raw.slice(lastIndex, match.index) });
    }

    if (match[1]) {
      tokens.push({ type: "code", value: match[1].slice(1, -1) });
    } else if (match[2]) {
      tokens.push({ type: "emphasis", value: match[2].slice(2, -2) });
    } else if (match[3]) {
      tokens.push({ type: "author" });
    }

    lastIndex = HERO_INTRO_TOKEN_PATTERN.lastIndex;
  }

  if (lastIndex < raw.length) {
    tokens.push({ type: "text", value: raw.slice(lastIndex) });
  }

  return tokens;
}

export function splitHeroIntroParagraphs(raw: string): string[] {
  return raw
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

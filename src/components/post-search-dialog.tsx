"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { RelativeDate } from "@/components/relative-date";

type SearchPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  publishedAt: string | null;
  content: string[];
};

type PostSearchDialogProps = {
  posts: SearchPost[];
};

export function PostSearchDialog({ posts }: PostSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const searchTerms = getSearchTerms(normalizedQuery);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  const results = posts
    .map((post) => ({
      post,
      score: getSearchScore(post, normalizedQuery, searchTerms),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || compareDates(b.post.publishedAt, a.post.publishedAt))
    .slice(0, 6);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-11 w-full items-center justify-between border-b border-zinc-200/80 px-0 text-sm text-zinc-500 transition hover:text-zinc-700 dark:border-zinc-800/80 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <span>Search posts</span>
        <Search className="h-4 w-4" />
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-start justify-center bg-zinc-950/35 px-4 py-20 dark:bg-black/55"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.18)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_30px_120px_rgba(0,0,0,0.5)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <Search className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search posts, tags, and notes"
                className="h-10 min-w-0 flex-1 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                aria-label="Close search dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[28rem] overflow-y-auto px-3 py-3">
              {normalizedQuery ? (
                results.length > 0 ? (
                  <div className="grid gap-1">
                    {results.map(({ post }) => (
                      <Link
                        key={post.slug}
                        href={`/posts/${post.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="rounded-[1.1rem] px-3 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                          <span>{post.category}</span>
                          {post.publishedAt ? <RelativeDate value={post.publishedAt} /> : null}
                        </div>
                        <p className="mt-2 text-sm font-medium text-zinc-950 dark:text-zinc-100">
                          {highlightText(post.title, searchTerms)}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                          {highlightText(getSearchPreview(post, normalizedQuery, searchTerms), searchTerms)}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.1rem] px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">
                    No matching posts found.
                  </div>
                )
              ) : (
                <div className="rounded-[1.1rem] px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">
                  Search by title, tag, category, or a line from the post.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function getSearchScore(post: SearchPost, query: string, searchTerms: string[]) {
  if (!query || searchTerms.length === 0) {
    return 0;
  }

  const title = post.title.toLowerCase();
  const description = post.description.toLowerCase();
  const category = post.category.toLowerCase();
  const tags = post.tags.map((tag) => tag.toLowerCase());
  const content = post.content.join(" ").toLowerCase();
  let score = 0;
  let matchedTerms = 0;

  if (title.includes(query)) {
    score += title.startsWith(query) ? 18 : 12;
  }

  if (description.includes(query)) {
    score += 7;
  }

  if (category.includes(query)) {
    score += 8;
  }

  if (tags.some((tag) => tag.includes(query))) {
    score += 8;
  }

  if (content.includes(query)) {
    score += 4;
  }

  for (const term of searchTerms) {
    const termWeight = Math.max(1, Math.min(term.length, 6));
    let termScore = 0;

    if (title.includes(term)) {
      termScore += term.length === 1 ? 2 : 6 + termWeight;
    }

    if (description.includes(term)) {
      termScore += term.length === 1 ? 1 : 3 + termWeight;
    }

    if (category.includes(term)) {
      termScore += term.length === 1 ? 2 : 4 + termWeight;
    }

    if (tags.some((tag) => tag.includes(term))) {
      termScore += term.length === 1 ? 2 : 4 + termWeight;
    }

    if (content.includes(term)) {
      termScore += term.length === 1 ? 1 : 2 + termWeight;
    }

    if (termScore > 0) {
      matchedTerms += 1;
      score += termScore;
    }
  }

  if (matchedTerms === searchTerms.length) {
    score += 8;
  } else if (matchedTerms > 1) {
    score += matchedTerms * 2;
  }

  return score;
}

function getSearchPreview(post: SearchPost, query: string, searchTerms: string[]) {
  if (!query || searchTerms.length === 0) {
    return post.description;
  }

  for (const term of [query, ...searchTerms]) {
    const descriptionIndex = post.description.toLowerCase().indexOf(term);

    if (descriptionIndex >= 0) {
      return createExcerpt(post.description, descriptionIndex, term.length);
    }
  }

  const contentText = post.content.join(" ");

  for (const term of [query, ...searchTerms]) {
    const contentIndex = contentText.toLowerCase().indexOf(term);

    if (contentIndex >= 0) {
      return createExcerpt(contentText, contentIndex, term.length);
    }
  }

  return post.description;
}

function createExcerpt(text: string, matchIndex: number, matchLength: number) {
  const radius = 72;
  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(text.length, matchIndex + matchLength + radius);
  const excerpt = text.slice(start, end).trim();

  if (!excerpt) {
    return text;
  }

  return `${start > 0 ? "... " : ""}${excerpt}${end < text.length ? " ..." : ""}`;
}

function highlightText(text: string, searchTerms: string[]) {
  if (searchTerms.length === 0) {
    return text;
  }

  const normalizedText = text.toLowerCase();
  const sortedTerms = [...searchTerms].sort((left, right) => right.length - left.length);
  const ranges: Array<{ start: number; end: number }> = [];

  for (const term of sortedTerms) {
    let cursor = 0;

    while (cursor < normalizedText.length) {
      const matchIndex = normalizedText.indexOf(term, cursor);

      if (matchIndex === -1) {
        break;
      }

      const nextRange = { start: matchIndex, end: matchIndex + term.length };
      const overlaps = ranges.some(
        (range) => nextRange.start < range.end && nextRange.end > range.start,
      );

      if (!overlaps) {
        ranges.push(nextRange);
      }

      cursor = matchIndex + term.length;
    }
  }

  if (ranges.length === 0) {
    return text;
  }

  ranges.sort((left, right) => left.start - right.start);

  const segments: Array<string | { match: string }> = [];
  let cursor = 0;

  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push(text.slice(cursor, range.start));
    }

    segments.push({ match: text.slice(range.start, range.end) });
    cursor = range.end;
  }

  if (cursor < text.length) {
    segments.push(text.slice(cursor));
  }

  return segments.map((segment, index) =>
    typeof segment === "string" ? (
      <span key={index}>{segment}</span>
    ) : (
      <mark
        key={index}
        className="rounded bg-primary/12 px-0.5 text-inherit dark:bg-sky-300/20"
      >
        {segment.match}
      </mark>
    ),
  );
}

function getSearchTerms(query: string) {
  if (!query) {
    return [];
  }

  const terms: string[] = [];
  const parts = query.match(/[a-z0-9]+|[\u4e00-\u9fff]+/gi) ?? [];

  if (query.length > 1) {
    terms.push(query);
  }

  for (const part of parts) {
    const normalizedPart = part.toLowerCase();

    if (/^[\u4e00-\u9fff]+$/u.test(normalizedPart)) {
      if (normalizedPart.length > 1) {
        terms.push(normalizedPart);
      }

      for (const char of normalizedPart) {
        terms.push(char);
      }
      continue;
    }

    terms.push(normalizedPart);
  }

  return Array.from(new Set(terms));
}

function compareDates(left: string | null, right: string | null) {
  const leftTime = left ? new Date(left).getTime() : 0;
  const rightTime = right ? new Date(right).getTime() : 0;
  return leftTime - rightTime;
}

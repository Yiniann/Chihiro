"use client";

import { useEffect, useMemo, useState } from "react";
import type { TableOfContentsItem } from "@/lib/content";

type TableOfContentsSection = {
  heading: TableOfContentsItem;
  children: TableOfContentsItem[];
};

export function PostTableOfContents({ items }: { items: TableOfContentsItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  const sections = useMemo<TableOfContentsSection[]>(() => {
    const result: TableOfContentsSection[] = [];
    let current: TableOfContentsSection | null = null;

    for (const item of items) {
      if (item.level === 2 || current === null) {
        current = { heading: item, children: [] };
        result.push(current);
      } else {
        current.children.push(item);
      }
    }

    return result;
  }, [items]);

  const activeSectionId = useMemo(() => {
    for (const section of sections) {
      if (
        section.heading.id === activeId ||
        section.children.some((child) => child.id === activeId)
      ) {
        return section.heading.id;
      }
    }
    return sections[0]?.heading.id ?? "";
  }, [sections, activeId]);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const visibleHeadings = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleHeadings.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visibleHeadings.delete(entry.target.id);
          }
        }

        const nextActiveId = Array.from(visibleHeadings.entries()).sort(
          (left, right) => left[1] - right[1],
        )[0]?.[0];

        if (nextActiveId) {
          setActiveId(nextActiveId);
        }
      },
      {
        rootMargin: "-112px 0px -65% 0px",
        threshold: [0, 1],
      },
    );

    for (const item of items) {
      const heading = document.getElementById(item.id);

      if (heading) {
        observer.observe(heading);
      }
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] overflow-y-auto border-l border-zinc-200/80 pl-5 text-sm dark:border-zinc-800/80 lg:block">
      <nav aria-label="文章目录" className="flex flex-col">
        {sections.map((section) => {
          const isOpen = section.heading.id === activeSectionId;

          return (
            <div key={section.heading.id} className="flex flex-col">
              <TOCLink item={section.heading} isActive={section.heading.id === activeId} />
              {section.children.length > 0 ? (
                <div
                  aria-hidden={!isOpen}
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    transition:
                      "grid-template-rows 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-out",
                    opacity: isOpen ? 1 : 0,
                    willChange: "grid-template-rows, opacity",
                  }}
                  className="grid overflow-hidden"
                >
                  <div className="flex min-h-0 flex-col">
                    {section.children.map((child) => (
                      <TOCLink
                        key={child.id}
                        item={child}
                        isActive={child.id === activeId}
                        tabIndex={isOpen ? 0 : -1}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function TOCLink({
  item,
  isActive,
  tabIndex,
}: {
  item: TableOfContentsItem;
  isActive: boolean;
  tabIndex?: number;
}) {
  const levelClassName =
    item.level === 2
      ? "font-medium"
      : item.level === 3
        ? "ml-4 text-[0.82rem]"
        : "ml-8 text-[0.78rem]";
  const toneClassName = isActive
    ? "font-medium text-primary"
    : "text-zinc-500 hover:text-primary dark:text-zinc-400";

  return (
    <a
      href={`#${item.id}`}
      tabIndex={tabIndex}
      className={`block py-[5px] leading-6 transition-colors ${toneClassName} ${levelClassName}`}
    >
      {item.text}
    </a>
  );
}

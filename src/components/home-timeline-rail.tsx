"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { TimelineItem } from "@/lib/timeline-items";
import { formatInSiteTimeZone } from "@/lib/site-time";

type HomeTimelineRailProps = {
  items: TimelineItem[];
  eyebrow: string;
  label: string;
  rangeStart: string;
  rangeEnd: string;
  timeZone?: string;
};

type TimelineCluster = {
  items: TimelineItem[];
  position: number;
};

export function HomeTimelineRail({
  items,
  eyebrow,
  label,
  rangeStart,
  rangeEnd,
  timeZone,
}: HomeTimelineRailProps) {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const pointRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const yearMarkers = useMemo(
    () => getTimelineYearMarkers(rangeStart, rangeEnd),
    [rangeEnd, rangeStart],
  );
  const currentYearMarker = yearMarkers.find((marker) => marker.current);
  const clusters = useMemo(() => {
    const positions = getTimelinePointPositions(items, rangeStart, rangeEnd);
    return getTimelineClusters(items, positions);
  }, [items, rangeEnd, rangeStart]);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setActiveIndex(null);
      closeTimeoutRef.current = null;
    }, 120);
  };

  useEffect(() => {
    setHasMounted(true);

    return () => {
      setHasMounted(false);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, []);

  useEffect(() => {
    if (activeIndex === null) {
      setTooltipStyle(null);
      return;
    }

    const point = pointRefs.current[activeIndex];

    if (!point) {
      setTooltipStyle(null);
      return;
    }

    const updateTooltipPosition = () => {
      const rect = point.getBoundingClientRect();
      const left = rect.left + rect.width / 2;
      const top = rect.top - 10;

      setTooltipStyle({
        left,
        top,
      });
    };

    updateTooltipPosition();
    window.addEventListener("scroll", updateTooltipPosition, { passive: true });
    window.addEventListener("resize", updateTooltipPosition);

    return () => {
      window.removeEventListener("scroll", updateTooltipPosition);
      window.removeEventListener("resize", updateTooltipPosition);
    };
  }, [activeIndex]);

  if (clusters.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-5xl pb-12 pt-6 lg:pb-14 lg:pt-8">
      <motion.div
        className="mb-6 flex justify-center"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14, filter: "blur(10px)" }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-center">
          <p className="text-sm font-normal uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            {eyebrow}
          </p>
          <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {label}
          </p>
        </div>
      </motion.div>

      <motion.div
        className="relative overflow-visible pb-3"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        whileInView={prefersReducedMotion ? undefined : { opacity: 1 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
      >
        <div
          className="relative px-2 py-8"
          onMouseLeave={scheduleClose}
        >
          <motion.div
            className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-zinc-300/90 dark:bg-zinc-700/90"
            initial={prefersReducedMotion ? false : { scaleX: 0, opacity: 0.45 }}
            whileInView={prefersReducedMotion ? undefined : { scaleX: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
            style={{ transformOrigin: "left center" }}
          />
          {currentYearMarker ? (
            <motion.div
              className="absolute top-1/2 h-px -translate-y-1/2 bg-primary/55 dark:bg-primary/60"
              initial={prefersReducedMotion ? false : { scaleX: 0, opacity: 0.55 }}
              whileInView={prefersReducedMotion ? undefined : { scaleX: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
              style={{
                left: `${currentYearMarker.position}%`,
                right: 0,
                transformOrigin: "left center",
              }}
            />
          ) : null}
          <div className="relative h-4">
            {clusters.map((cluster, index) => {
              const isActive = index === activeIndex;
              const left = cluster.position;
              const pointClass = getClusterPointClass(cluster.items.length, isActive);
              const pointGlowClass = getClusterPointGlowClass(cluster.items.length, isActive);
              const pointDelay = 0.18 + (cluster.position / 100) * 0.55;

              return (
                <motion.div
                  key={cluster.items.map((item) => `${item.kindLabel}-${item.id}`).join("-")}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${left}%` }}
                  initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.6 }}
                  whileInView={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{
                    duration: 0.5,
                    delay: pointDelay,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <button
                    ref={(node) => {
                      pointRefs.current[index] = node;
                    }}
                    type="button"
                    onMouseEnter={() => {
                      clearCloseTimeout();
                      setActiveIndex(index);
                    }}
                    onFocus={() => {
                      clearCloseTimeout();
                      setActiveIndex(index);
                    }}
                    onClick={() => setActiveIndex((current) => (current === index ? null : index))}
                    className="group flex flex-col items-center text-center"
                    >
                      <span className="relative z-10 flex h-5 w-5 items-center justify-center">
                        <span className={pointGlowClass} />
                        <span className={pointClass} />
                      </span>
                  </button>
                </motion.div>
              );
            })}
          </div>

          {yearMarkers.length > 0 ? (
            <div className="pointer-events-none absolute inset-x-2 top-1/2 translate-y-[6px]">
              {yearMarkers.map((marker) => (
                <div
                  key={marker.year}
                  className="absolute -translate-x-1/2 text-center"
                  style={{ left: `${marker.position}%` }}
                >
                  <span className={`mx-auto block h-1.5 w-px ${marker.current ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700"}`} />
                  <span
                    className={`mt-0.5 block text-[10px] tracking-[0.16em] ${
                      marker.current
                        ? "text-primary"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {marker.year}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </motion.div>

      {hasMounted && activeIndex !== null && tooltipStyle
        ? createPortal(
            <div
              className="fixed z-50"
              style={{
                left: tooltipStyle.left,
                top: tooltipStyle.top,
                transform: "translate(-50%, -100%)",
              }}
              onMouseEnter={clearCloseTimeout}
              onMouseLeave={scheduleClose}
            >
              <div className="w-max max-w-[24rem] rounded-xl border border-zinc-200/80 bg-white/95 px-3 py-2.5 text-left shadow-[0_18px_60px_rgba(24,24,27,0.12)] backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/95 dark:shadow-[0_20px_70px_rgba(0,0,0,0.42)]">
                <div className="grid gap-1">
                  {clusters[activeIndex].items.map((item) => (
                    <h3
                      key={`${item.kindLabel}-${item.id}`}
                      className="max-w-full text-sm font-semibold leading-6 text-zinc-950 dark:text-zinc-50"
                    >
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="transition hover:text-primary"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        item.title
                      )}
                      <span className="ml-2 inline text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                        {formatRailMarkerDate(item.publishedAt, timeZone)}
                      </span>
                    </h3>
                  ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

    </section>
  );
}

function formatRailMarkerDate(value: string | null, timeZone?: string) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatInSiteTimeZone(date, "en", {
    month: "short",
  }, timeZone);
}

function getTimelinePointPositions(items: TimelineItem[], rangeStart: string, rangeEnd: string) {
  const { resolvedRangeStart, resolvedRangeEnd, rangeDuration } = resolveTimelineRange(
    rangeStart,
    rangeEnd,
  );

  return items.map((item, index) => {
    if (!item.publishedAt) {
      return distributeFallbackPosition(index, items.length);
    }

    const publishedAt = new Date(item.publishedAt);

    if (Number.isNaN(publishedAt.getTime())) {
      return distributeFallbackPosition(index, items.length);
    }

    const clampedTime = Math.min(
      Math.max(publishedAt.getTime(), resolvedRangeStart),
      resolvedRangeEnd,
    );
    const progress = (clampedTime - resolvedRangeStart) / rangeDuration;
    return Math.min(Math.max(progress * 100, 0), 100);
  });
}

function getTimelineYearMarkers(rangeStart: string, rangeEnd: string) {
  const { resolvedRangeStart, resolvedRangeEnd, rangeDuration } = resolveTimelineRange(
    rangeStart,
    rangeEnd,
  );
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear];

  return years.flatMap((year) => {
    const markerDate = new Date(year, 0, 1).getTime();

    if (markerDate < resolvedRangeStart || markerDate > resolvedRangeEnd) {
      return [];
    }

    const progress = (markerDate - resolvedRangeStart) / rangeDuration;

    return [
      {
        year: String(year),
        current: year === currentYear,
        position: Math.min(Math.max(progress * 100, 0), 100),
      },
    ];
  });
}

function resolveTimelineRange(rangeStart: string, rangeEnd: string) {
  const rangeStartTime = new Date(rangeStart).getTime();
  const rangeEndTime = new Date(rangeEnd).getTime();
  const resolvedRangeStart = Number.isNaN(rangeStartTime) ? 0 : rangeStartTime;
  const resolvedRangeEnd = Number.isNaN(rangeEndTime) ? Date.now() : rangeEndTime;
  const rangeDuration = Math.max(resolvedRangeEnd - resolvedRangeStart, 1);

  return {
    resolvedRangeStart,
    resolvedRangeEnd,
    rangeDuration,
  };
}

function getTimelineClusters(items: TimelineItem[], positions: number[]) {
  const sorted = items
    .map((item, index) => ({
      item,
      position: positions[index] ?? 0,
    }))
    .sort((left, right) => left.position - right.position);
  const clusters: TimelineCluster[] = [];
  const mergeThresholdMs = 5 * 24 * 60 * 60 * 1000;

  for (const entry of sorted) {
    const current = clusters[clusters.length - 1];

    if (!current) {
      clusters.push({
        items: [entry.item],
        position: entry.position,
      });
      continue;
    }

    const currentLastItem = current.items[current.items.length - 1];
    const currentLastTime = getTimelineItemTime(currentLastItem.publishedAt);
    const entryTime = getTimelineItemTime(entry.item.publishedAt);

    if (
      currentLastTime !== null &&
      entryTime !== null &&
      Math.abs(entryTime - currentLastTime) <= mergeThresholdMs
    ) {
      current.items.push(entry.item);
      current.position =
        current.items.reduce((sum, item) => {
          const itemPosition = positions[items.indexOf(item)] ?? entry.position;
          return sum + itemPosition;
        }, 0) / current.items.length;
      continue;
    }

    clusters.push({
      items: [entry.item],
      position: entry.position,
    });
  }

  return clusters;
}

function getTimelineItemTime(value: string | null) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function getClusterPointClass(count: number, isActive: boolean) {
  if (count >= 2) {
    return isActive
      ? "relative block h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.18)] transition"
      : "relative block h-2.5 w-2.5 rounded-full bg-primary/90 shadow-[0_0_6px_rgba(var(--primary-rgb),0.12)] transition group-hover:bg-primary group-hover:shadow-[0_0_9px_rgba(var(--primary-rgb),0.16)]";
  }

  return isActive
    ? "relative block h-2 w-2 rounded-full bg-primary shadow-[0_0_7px_rgba(var(--primary-rgb),0.14)] transition"
    : "relative block h-1.5 w-1.5 rounded-full bg-primary/90 shadow-[0_0_5px_rgba(var(--primary-rgb),0.1)] transition group-hover:bg-primary group-hover:shadow-[0_0_8px_rgba(var(--primary-rgb),0.14)]";
}

function getClusterPointGlowClass(count: number, isActive: boolean) {
  if (count >= 2) {
    return isActive
      ? "absolute h-4 w-4 rounded-full bg-primary/10 blur-[2px] transition"
      : "absolute h-3 w-3 rounded-full bg-primary/7 blur-[2px] transition group-hover:bg-primary/10";
  }

  return isActive
    ? "absolute h-3 w-3 rounded-full bg-primary/8 blur-[2px] transition"
    : "absolute h-2 w-2 rounded-full bg-primary/5 blur-[2px] transition group-hover:bg-primary/8";
}

function distributeFallbackPosition(index: number, total: number) {
  if (total <= 1) {
    return 100;
  }

  return (index / (total - 1)) * 100;
}

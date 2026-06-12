"use client";

import { ChartColumnBig } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { formatAdminNumber } from "@/app/(admin)/admin/utils";
import { DialogShell } from "@/components/dialog-shell";
import { useDialogShake } from "@/components/use-dialog-shake";
import type { UpdateKindValue } from "@/lib/update-kind";

type PublishingOverviewProps = {
  posts: Array<string | null>;
  updates: Array<{
    publishedAt: string | null;
    kind: UpdateKindValue;
  }>;
  standalonePages: Array<string | null>;
};

type DistributionItem = {
  label: string;
  value: number;
  direction: "top" | "right" | "bottom" | "left";
  unit: string;
  empty?: boolean;
};

type PublishingTrendWeek = {
  key: string;
  days: Array<{
    key: string;
    count: number;
    label: string;
    level: 0 | 1 | 2 | 3 | 4;
    isInRange: boolean;
    date: Date;
  }>;
};

type PublishingTrendMonthLabel = {
  key: string;
  label: string;
  column: number;
};

export function TimelinePublishingOverview({
  posts,
  updates,
  standalonePages,
}: PublishingOverviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const years = useMemo(
    () => getPublishingTrendYears(posts, updates, standalonePages),
    [posts, standalonePages, updates],
  );
  const [selectedYear, setSelectedYear] = useState(years[0] ?? new Date().getFullYear());

  const trend = useMemo(
    () => buildPublishingTrend(posts, updates, standalonePages, selectedYear),
    [posts, selectedYear, standalonePages, updates],
  );

  const distributionItems = useMemo<DistributionItem[]>(
    () => [
      {
        label: "文章",
        value: countPublishedInYear(posts, selectedYear),
        direction: "top",
        unit: "篇",
      },
      {
        label: "动态",
        value: countPublishedInYear(updates.map((item) => item.publishedAt), selectedYear),
        direction: "left",
        unit: "条",
      },
      {
        label: "独立页面",
        value: countPublishedInYear(standalonePages, selectedYear),
        direction: "bottom",
        unit: "页",
      },
      {
        label: "鉴赏",
        value: countPublishedReviewUpdatesInYear(updates, selectedYear),
        direction: "right",
        unit: "项",
      },
    ],
    [posts, selectedYear, standalonePages, updates],
  );

  const totalPublished = trend.weeks.reduce(
    (sum, week) =>
      sum +
      week.days.reduce(
        (daySum, day) => daySum + (day.isInRange ? day.count : 0),
        0,
      ),
    0,
  );
  return (
    <section>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group inline-flex items-center gap-1.5 p-1 text-left"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Open annual publishing overview"
      >
        <span className="inline-flex size-5 items-center justify-center text-primary transition group-hover:opacity-80">
          <ChartColumnBig className="size-4" />
        </span>
        <span className="text-xs font-medium tracking-tight text-primary transition group-hover:opacity-80">
          年度回顾
        </span>
      </button>

      <TimelinePublishingOverviewDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:flex-row md:items-start md:gap-6">
          <nav
            aria-label="Publishing years"
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-200/80 pb-4 dark:border-zinc-800/80 md:grid md:shrink-0 md:gap-2 md:border-b-0 md:border-r md:pb-0 md:pr-6"
          >
            {years.map((year) => {
              const active = year === selectedYear;

              return (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={`inline-flex h-7 items-center text-sm font-semibold tracking-tight transition sm:h-8 sm:text-base ${
                    active
                      ? "text-primary"
                      : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                  }`}
                >
                  {year}
                </button>
              );
            })}
          </nav>

          <div className="grid min-w-0 flex-1 gap-5">
            <div className="grid gap-1">
              <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">
                Annual Publishing
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {selectedYear} 年 {trend.totalDays} 天内共发布 {formatAdminNumber(totalPublished)} 条
              </p>
            </div>

            <div className="grid gap-3">
              <div className="max-w-full overflow-x-auto md:overflow-x-visible">
                <div className="inline-block min-w-max">
                  <div
                    className="grid gap-x-1 gap-y-1"
                    style={{ gridTemplateColumns: `1.25rem repeat(${trend.weeks.length}, 10px)` }}
                  >
                    <div />
                    {trend.weeks.map((week, index) => {
                      const monthLabel = trend.monthLabels.find((label) => label.column === index);

                      return (
                        <div key={`${week.key}-month`} className="relative h-3">
                          {monthLabel ? (
                            <span className="absolute left-0 top-0 whitespace-nowrap text-[10px] leading-3 text-zinc-500 dark:text-zinc-400">
                              {monthLabel.label}
                            </span>
                          ) : null}
                        </div>
                      );
                    })}

                    <div className="grid grid-rows-7 gap-0.5 pt-px text-[10px] text-zinc-500 dark:text-zinc-400">
                      <span />
                      <span className="leading-3">一</span>
                      <span />
                      <span className="leading-3">三</span>
                      <span />
                      <span className="leading-3">五</span>
                      <span />
                    </div>

                    {trend.weeks.map((week) => (
                      <div key={week.key} className="grid grid-rows-7 gap-0.5">
                        {week.days.map((day) => (
                          <div key={day.key} className="group relative">
                            <div
                              aria-label={day.label}
                              className={getTrendCellClassName(day.level, day.isInRange)}
                            />
                            {day.isInRange ? (
                              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 opacity-0 transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                                <div className="rounded-md bg-zinc-950 px-2.5 py-1.5 text-[11px] text-white shadow-lg shadow-zinc-950/15 dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-black/20">
                                  {day.label}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pr-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                <span>Less</span>
                <div className="flex items-center gap-0.5">
                  {[0, 1, 2, 3, 4].map((level) => (
                    <span
                      key={level}
                      className={getTrendCellClassName(level as 0 | 1 | 2 | 3 | 4, true)}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </div>

            <div className="pt-2">
              <TimelinePublishingDistribution
                items={distributionItems}
                selectedYear={selectedYear}
              />
            </div>
          </div>
        </div>
      </TimelinePublishingOverviewDialog>
    </section>
  );
}

function TimelinePublishingOverviewDialog({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { shakeControls, triggerShake } = useDialogShake();

  return (
    <DialogShell
      open={isOpen}
      onOpenChange={onClose}
      title="Annual publishing overview"
      eyebrow="Timeline Capsule"
      maxWidthClassName="max-w-6xl"
      closeLabel="Close annual publishing overview"
      panelClassName="rounded-[1.75rem] border border-zinc-200/80 !bg-white/80 shadow-sm backdrop-blur-sm dark:border-white/14 dark:!bg-[rgba(255,255,255,0.06)] dark:shadow-[0_18px_45px_rgba(2,6,23,0.06)]"
      overlayClassName="!bg-transparent !backdrop-blur-none dark:!bg-transparent"
      closeOnOverlayClick={false}
      onOverlayClick={triggerShake}
      panelAnimationControls={shakeControls}
      lockBodyScroll={false}
      overlayScrollable={false}
      align="top"
      bodyClassName="max-h-[80vh] overflow-y-auto px-5 py-5"
    >
      {children}
    </DialogShell>
  );
}

function TimelinePublishingDistribution({
  items,
  selectedYear,
}: {
  items: DistributionItem[];
  selectedYear: number;
}) {
  const totalValue = items.reduce(
    (sum, item) => sum + (item.empty ? 0 : item.value),
    0,
  );
  const topItem = items.find((item) => item.direction === "top");
  const rightItem = items.find((item) => item.direction === "right");
  const bottomItem = items.find((item) => item.direction === "bottom");
  const leftItem = items.find((item) => item.direction === "left");
  const maxValue = Math.max(
    ...items.map((item) => (item.empty ? 0 : item.value)),
    0,
  );
  const topArm = getCrossArmLength(topItem, maxValue);
  const rightArm = getCrossArmLength(rightItem, maxValue);
  const bottomArm = getCrossArmLength(bottomItem, maxValue);
  const leftArm = getCrossArmLength(leftItem, maxValue);
  const nodeDiameterX = (0.625 / 14) * 100;
  const nodeDiameterY = (0.625 / 12) * 100;
  const polygonPoints = [
    `50 ${50 - (topArm > 0 ? topArm + nodeDiameterY : 0)}`,
    `${50 + (rightArm > 0 ? rightArm + nodeDiameterX : 0)} 50`,
    `50 ${50 + (bottomArm > 0 ? bottomArm + nodeDiameterY : 0)}`,
    `${50 - (leftArm > 0 ? leftArm + nodeDiameterX : 0)} 50`,
  ].join(" ");

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
      <div className="grid gap-3 md:min-w-[15rem]">
        <div className="grid gap-1">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            发布结构
          </p>
          <p className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {selectedYear} 年发布概况
          </p>
        </div>

        <div className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          {items.map((item) => {
            const copy =
              item.label === "鉴赏"
                ? `鉴赏型动态 ${formatAdminNumber(item.value)} ${item.unit}`
                : `${item.label} ${formatAdminNumber(item.value)} ${item.unit}`;

            return <p key={item.label}>{copy}</p>;
          })}
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            鉴赏统计包含影视、音乐与物品类动态。
          </p>
        </div>
      </div>

      <div className="flex justify-center py-2 md:flex-1 md:justify-start">
        <div className="relative h-[20rem] w-full max-w-[24rem]">
          <div className="absolute inset-x-0 top-0 flex justify-center text-center">
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {topItem?.label}
              </p>
              {shouldShowCrossValue(topItem, totalValue) ? (
                <p className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {renderCrossValue(topItem, totalValue)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="absolute inset-y-0 left-0 flex items-center text-right">
            <div className="flex flex-col items-end gap-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {leftItem?.label}
              </p>
              {shouldShowCrossValue(leftItem, totalValue) ? (
                <p className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {renderCrossValue(leftItem, totalValue)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center text-left">
            <div className="flex flex-col items-start gap-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {rightItem?.label}
              </p>
              {shouldShowCrossValue(rightItem, totalValue) ? (
                <p className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {renderCrossValue(rightItem, totalValue)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex justify-center text-center">
            <div className="flex flex-col items-center gap-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {bottomItem?.label}
              </p>
              {shouldShowCrossValue(bottomItem, totalValue) ? (
                <p className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {renderCrossValue(bottomItem, totalValue)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="absolute inset-x-20 inset-y-16">
            <div className="relative h-full w-full">
              <svg
                viewBox="0 0 100 100"
                aria-hidden="true"
                className="absolute inset-0 h-full w-full overflow-visible"
              >
                <polygon
                  points={polygonPoints}
                  className="fill-primary/18 dark:fill-primary/22"
                />
              </svg>
              <div className="absolute left-1/2 top-1/2 h-full w-px -translate-x-1/2 -translate-y-1/2 bg-primary/30 dark:bg-primary/40" />
              <div className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 bg-primary/30 dark:bg-primary/40" />

              <div className="absolute left-1/2 top-1/2 z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-white dark:bg-zinc-950" />

              {items.map((item) => {
                const percent = getCrossPercent(item, maxValue);
                const armLength = (percent / 100) * 6.5;
                const armClassName = item.empty
                  ? "bg-zinc-300/80 dark:bg-zinc-700/80"
                  : "bg-primary";
                const nodeClassName = item.empty
                  ? "border-zinc-300 dark:border-zinc-700"
                  : "border-primary";

                if (item.direction === "top") {
                  return (
                    <div key={item.label}>
                      <div
                        className={`absolute left-1/2 top-1/2 z-[1] w-px -translate-x-1/2 rounded-full ${armClassName}`}
                        style={{ height: `${armLength}rem`, marginTop: `-${armLength}rem` }}
                      />
                      <div
                        className={`absolute left-1/2 z-[2] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white dark:bg-zinc-950 ${nodeClassName}`}
                        style={{ top: `calc(50% - ${armLength}rem)` }}
                      />
                    </div>
                  );
                }

                if (item.direction === "right") {
                  return (
                    <div key={item.label}>
                      <div
                        className={`absolute left-1/2 top-1/2 z-[1] h-px -translate-y-1/2 rounded-full ${armClassName}`}
                        style={{ width: `${armLength}rem` }}
                      />
                      <div
                        className={`absolute top-1/2 z-[2] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white dark:bg-zinc-950 ${nodeClassName}`}
                        style={{ left: `calc(50% + ${armLength}rem)` }}
                      />
                    </div>
                  );
                }

                if (item.direction === "bottom") {
                  return (
                    <div key={item.label}>
                      <div
                        className={`absolute left-1/2 top-1/2 z-[1] w-px -translate-x-1/2 rounded-full ${armClassName}`}
                        style={{ height: `${armLength}rem` }}
                      />
                      <div
                        className={`absolute left-1/2 z-[2] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white dark:bg-zinc-950 ${nodeClassName}`}
                        style={{ top: `calc(50% + ${armLength}rem)` }}
                      />
                    </div>
                  );
                }

                return (
                  <div key={item.label}>
                    <div
                      className={`absolute right-1/2 top-1/2 z-[1] h-px -translate-y-1/2 rounded-full ${armClassName}`}
                      style={{ width: `${armLength}rem` }}
                    />
                    <div
                      className={`absolute top-1/2 z-[2] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white dark:bg-zinc-950 ${nodeClassName}`}
                      style={{ left: `calc(50% - ${armLength}rem)` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function countPublishedInYear(
  items: Array<string | null>,
  year: number,
) {
  return items.filter((value) => {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.getFullYear() === year;
  }).length;
}

function countPublishedReviewUpdatesInYear(
  items: Array<{ publishedAt: string | null; kind: UpdateKindValue }>,
  year: number,
) {
  return items.filter((item) => {
    if (!item.publishedAt) {
      return false;
    }

    const date = new Date(item.publishedAt);

    if (Number.isNaN(date.getTime()) || date.getFullYear() !== year) {
      return false;
    }

    return item.kind === "MOVIE" || item.kind === "MUSIC" || item.kind === "OBJECT";
  }).length;
}

function getPublishingTrendYears(
  posts: Array<string | null>,
  updates: Array<{ publishedAt: string | null }>,
  standalonePages: Array<string | null>,
) {
  const years = new Set<number>([new Date().getFullYear()]);

  for (const value of [
    ...posts,
    ...updates.map((item) => item.publishedAt),
    ...standalonePages,
  ]) {
    if (!value) {
      continue;
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      years.add(date.getFullYear());
    }
  }

  return Array.from(years).sort((a, b) => b - a);
}

function buildPublishingTrend(
  posts: Array<string | null>,
  updates: Array<{ publishedAt: string | null }>,
  standalonePages: Array<string | null>,
  selectedYear: number,
) {
  const rangeStart = startOfDay(new Date(selectedYear, 0, 1));
  const rangeEnd = startOfDay(new Date(selectedYear, 11, 31));
  const totalDays = getInclusiveDayCount(rangeStart, rangeEnd);
  const gridStart = startOfWeek(rangeStart);
  const gridEnd = endOfWeek(rangeEnd);

  const countsByDay = new Map<string, number>();

  for (const value of [
    ...posts,
    ...updates.map((item) => item.publishedAt),
    ...standalonePages,
  ]) {
    if (!value) {
      continue;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime()) || date < rangeStart || date > rangeEnd) {
      continue;
    }

    const dayKey = formatDayKey(date);
    countsByDay.set(dayKey, (countsByDay.get(dayKey) ?? 0) + 1);
  }

  const weeks: PublishingTrendWeek[] = [];
  const monthLabels: PublishingTrendMonthLabel[] = [];
  const cursor = new Date(gridStart);
  let weekIndex = 0;
  let previousMonth = "";

  while (cursor <= gridEnd) {
    const days: PublishingTrendWeek["days"] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const date = new Date(cursor);
      date.setDate(cursor.getDate() + dayIndex);

      const key = formatDayKey(date);
      const count = countsByDay.get(key) ?? 0;
      const isInRange = date >= rangeStart && date <= rangeEnd;

      days.push({
        key,
        count,
        label: `${formatPreciseTrendDate(date)} 发布 ${formatAdminNumber(count)} 条`,
        level: isInRange ? getTrendLevel(count) : 0,
        isInRange,
        date,
      });
    }

    const monthSource = days.find((day) => day.isInRange);
    if (monthSource) {
      const monthKey = `${monthSource.date.getFullYear()}-${monthSource.date.getMonth() + 1}`;

      if (monthKey !== previousMonth) {
        monthLabels.push({
          key: monthKey,
          label: formatTrendMonth(monthSource.date),
          column: weekIndex,
        });
        previousMonth = monthKey;
      }
    }

    weeks.push({
      key: days[0]?.key ?? `week-${weekIndex}`,
      days,
    });

    cursor.setDate(cursor.getDate() + 7);
    weekIndex += 1;
  }

  return { weeks, monthLabels, totalDays };
}

function renderCrossValue(item: DistributionItem | undefined, totalValue: number) {
  if (!item || item.empty || totalValue <= 0) {
    return "";
  }

  return `${getCrossPercent(item, totalValue)}%`;
}

function shouldShowCrossValue(item: DistributionItem | undefined, totalValue: number) {
  return Boolean(item && !item.empty && totalValue > 0);
}

function getCrossArmLength(item: DistributionItem | undefined, maxValue: number) {
  const percent = getCrossPercent(item, maxValue);

  if (percent <= 0) {
    return 0;
  }

  return (percent / 100) * 50;
}

function getCrossPercent(item: DistributionItem | undefined, baseValue: number) {
  if (!item || item.empty || baseValue <= 0) {
    return 0;
  }

  return Math.round((item.value / baseValue) * 100);
}

function getTrendCellClassName(level: 0 | 1 | 2 | 3 | 4, isInRange: boolean) {
  const baseClassName = "block size-[10px] rounded-[2px]";

  if (!isInRange) {
    return `${baseClassName} bg-transparent`;
  }

  switch (level) {
    case 0:
      return `${baseClassName} bg-zinc-200/80 dark:bg-zinc-800/80`;
    case 1:
      return `${baseClassName} bg-primary/42 dark:bg-primary/45`;
    case 2:
      return `${baseClassName} bg-primary/62 dark:bg-primary/64`;
    case 3:
      return `${baseClassName} bg-primary/82 dark:bg-primary/84`;
    case 4:
      return `${baseClassName} bg-primary dark:bg-primary`;
  }
}

function getTrendLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) {
    return 0;
  }

  if (count === 1) {
    return 1;
  }

  if (count <= 3) {
    return 2;
  }

  if (count <= 5) {
    return 3;
  }

  return 4;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const nextDate = startOfDay(date);
  nextDate.setDate(nextDate.getDate() - nextDate.getDay());
  return nextDate;
}

function endOfWeek(date: Date) {
  const nextDate = startOfWeek(date);
  nextDate.setDate(nextDate.getDate() + 6);
  return nextDate;
}

function getInclusiveDayCount(startDate: Date, endDate: Date) {
  const startTime = startOfDay(startDate).getTime();
  const endTime = startOfDay(endDate).getTime();
  return Math.floor((endTime - startTime) / 86_400_000) + 1;
}

function formatDayKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatPreciseTrendDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

function formatTrendMonth(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

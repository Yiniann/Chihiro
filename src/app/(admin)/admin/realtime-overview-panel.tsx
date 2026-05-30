"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, TrendingUp, Users } from "lucide-react";
import { formatAdminNumber } from "@/app/(admin)/admin/utils";

type PresenceSummary = {
  onlineVisitors: number;
  activeSessions: number;
  todayVisitors: number;
  todayPeakOnlineVisitors: number;
  generatedAt: number;
};

const REFRESH_INTERVAL_MS = 15_000;

export function RealtimeOverviewPanel({
  initialSummary,
}: {
  initialSummary: PresenceSummary | null;
}) {
  const [summary, setSummary] = useState<PresenceSummary | null>(initialSummary);
  const [status, setStatus] = useState<"live" | "offline">(
    initialSummary ? "live" : "offline",
  );

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch("/api/presence/summary", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setStatus("offline");
          }
          return;
        }

        const nextSummary = (await response.json()) as PresenceSummary;

        if (!cancelled) {
          setSummary(nextSummary);
          setStatus("live");
        }
      } catch {
        if (!cancelled) {
          setStatus("offline");
        }
      }
    }

    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const cards = useMemo(
    () => [
      {
        label: "当前访客人数",
        value: formatAdminNumber(summary?.onlineVisitors ?? 0),
        icon: Users,
      },
      {
        label: "今日访问人数",
        value: formatAdminNumber(summary?.todayVisitors ?? 0),
        icon: Activity,
      },
      {
        label: "今日最高同时在线",
        value: formatAdminNumber(summary?.todayPeakOnlineVisitors ?? 0),
        icon: TrendingUp,
      },
    ],
    [summary],
  );

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            实时数据
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="relative inline-flex size-2 shrink-0">
            <span
              className={
                status === "live"
                  ? "absolute inset-0 rounded-full bg-emerald-400/55 animate-ping"
                  : "absolute inset-0 rounded-full bg-rose-400/55 animate-ping"
              }
            />
            <span
              className={
                status === "live"
                  ? "relative size-2 rounded-full bg-emerald-500 dark:bg-emerald-400"
                  : "relative size-2 rounded-full bg-rose-500 dark:bg-rose-400"
              }
            />
          </span>
          <span>{status === "live" ? "实时连接中" : "实时数据暂时不可用"}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => (
          <article
            key={card.label}
            className="border-r border-zinc-200/80 pr-3 last:border-r-0 last:pr-0 dark:border-zinc-800/80"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex size-7 shrink-0 items-center justify-center text-zinc-400 dark:text-zinc-500 sm:size-8">
                <card.icon className="size-4.5 sm:size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                  {card.label}
                </p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-2xl">
                  {card.value}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

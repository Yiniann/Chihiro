"use client";

import { useEffect, useState } from "react";

type PresenceSummary = {
  onlineVisitors: number;
  activeSessions: number;
};

const REFRESH_INTERVAL_MS = 20_000;

export function SiteLiveVisitors() {
  const [summary, setSummary] = useState<PresenceSummary | null>(null);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "error">(
    "connecting",
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
            setConnectionState("error");
          }
          return;
        }

        const data = (await response.json()) as PresenceSummary;

        if (!cancelled) {
          setSummary(data);
          setConnectionState("connected");
        }
      } catch {
        if (!cancelled) {
          setConnectionState("error");
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

  const onlineVisitors = summary?.onlineVisitors ?? 0;
  const isConnected = connectionState === "connected";
  const isOffline = connectionState !== "connected";

  return (
    <p className="mt-4 flex min-w-0 items-center gap-3 text-sm leading-6 text-n-5">
      <span className="relative inline-flex size-2 shrink-0">
        <span
          className={
            isOffline
              ? "absolute inset-0 rounded-full bg-rose-400/55 animate-ping"
              : "absolute inset-0 rounded-full bg-emerald-400/55 animate-ping"
          }
        />
        <span
          className={
            isOffline
              ? "relative size-2 rounded-full bg-rose-500 dark:bg-rose-400"
              : "relative size-2 rounded-full bg-emerald-500 dark:bg-emerald-400"
          }
        />
      </span>
      {!isConnected ? (
        <>当前在线状态未接入</>
      ) : (
        <>
          当前站点有{" "}
          <span className="font-semibold text-n-6">{onlineVisitors}</span>{" "}
          人正在访问
        </>
      )}
    </p>
  );
}

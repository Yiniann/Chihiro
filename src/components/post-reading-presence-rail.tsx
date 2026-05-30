"use client";

import throttle from "lodash.throttle";
import { useEffect, useRef, useState } from "react";
import {
  PRESENCE_HEARTBEAT_INTERVAL_MS,
  PRESENCE_PROGRESS_DELTA_PERCENT,
  PRESENCE_PROGRESS_THROTTLE_MS,
  type PresenceSnapshot,
} from "@/lib/live-presence";
import { getOrCreatePresenceTabId } from "@/lib/presence-tab-id";
import { getReadingProgressValue, READING_PROGRESS_ROOT_SELECTOR } from "@/lib/reading-progress";

type PostReadingPresenceRailProps = {
  postId: number;
  postSlug: string;
  pathname: string;
  realtimePort: number;
  selfAvatarUrl: string | null;
  selfDisplayName: string | null;
};

type PresenceMetrics = {
  progressPercent: number;
  currentHeading: string | null;
};

type PresenceSessionResponse = {
  visitorId: string;
};

type RailReader = PresenceSnapshot["readers"][number];

type GroupedReader = {
  id: string;
  readers: RailReader[];
  progressPercent: number;
  includesSelf: boolean;
};

const MIN_GROUP_PROGRESS_DELTA = 2;
const RAIL_TOP_OFFSET_PX = 128;
const RAIL_BOTTOM_OFFSET_PX = 56;
const GROUP_TOOLTIP_HEIGHT_PX = 22;

export function PostReadingPresenceRail({
  postId,
  postSlug,
  pathname,
  realtimePort,
  selfAvatarUrl,
  selfDisplayName,
}: PostReadingPresenceRailProps) {
  const [snapshot, setSnapshot] = useState<PresenceSnapshot | null>(null);
  const [selfMetrics, setSelfMetrics] = useState<PresenceMetrics>({
    progressPercent: 0,
    currentHeading: null,
  });
  const [selfSessionKey, setSelfSessionKey] = useState<string | null>(null);
  const [resolvedSelfAvatarUrl, setResolvedSelfAvatarUrl] = useState<string | null>(selfAvatarUrl);
  const [isRailHovered, setIsRailHovered] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const lastSentProgressRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setResolvedSelfAvatarUrl(selfAvatarUrl);
  }, [selfAvatarUrl]);

  useEffect(() => {
    if (selfAvatarUrl) {
      return;
    }

    const selector = "[data-current-user-avatar='true']";
    let animationFrame = 0;
    let retryTimeout = 0;

    const syncAvatarFromDom = () => {
      const domAvatar = document.querySelector<HTMLImageElement>(selector);

      if (domAvatar?.src) {
        setResolvedSelfAvatarUrl(domAvatar.src);
        return true;
      }

      return false;
    };

    if (syncAvatarFromDom()) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      animationFrame = window.requestAnimationFrame(() => {
        if (syncAvatarFromDom()) {
          observer.disconnect();
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });

    retryTimeout = window.setTimeout(() => {
      syncAvatarFromDom();
    }, 300);

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      if (retryTimeout) {
        window.clearTimeout(retryTimeout);
      }

      observer.disconnect();
    };
  }, [selfAvatarUrl]);

  useEffect(() => {
    let cancelled = false;
    let heartbeatTimer: number | null = null;
    let reconnectTimer: number | null = null;
    const throttledPresenceSync = throttle(() => {
      const nextMetrics = readPresenceMetrics();

      if (Math.abs(nextMetrics.progressPercent - lastSentProgressRef.current) < PRESENCE_PROGRESS_DELTA_PERCENT) {
        return;
      }

      sendPresenceUpdate("presence:update");
    }, PRESENCE_PROGRESS_THROTTLE_MS);

    const syncSelfMetrics = () => {
      animationFrameRef.current = null;
      setSelfMetrics(readPresenceMetrics());
    };

    async function connect() {
      try {
        const sessionResponse = await fetch("/api/presence/session", {
          cache: "no-store",
        });

        if (!sessionResponse.ok) {
          return;
        }

        const session = (await sessionResponse.json()) as PresenceSessionResponse;

        if (!session.visitorId || cancelled) {
          return;
        }

        const tabId = getOrCreatePresenceTabId();
        setSelfSessionKey(tabId);
        const socket = new WebSocket(buildRealtimeUrl(realtimePort));
        socketRef.current = socket;

        socket.addEventListener("open", () => {
          if (cancelled) {
            socket.close();
            return;
          }

          const initialMetrics = readPresenceMetrics();
          setSelfMetrics(initialMetrics);
          lastSentProgressRef.current = initialMetrics.progressPercent;
          socket.send(
            JSON.stringify({
              type: "presence:join",
              payload: {
                postId,
                postSlug,
                pathname,
                visitorId: session.visitorId,
                tabId,
                referrer: document.referrer || null,
                ...initialMetrics,
              },
            }),
          );

          heartbeatTimer = window.setInterval(() => {
            sendPresenceUpdate("presence:heartbeat");
          }, PRESENCE_HEARTBEAT_INTERVAL_MS);
        });

        socket.addEventListener("message", (event) => {
          try {
            const message = JSON.parse(event.data) as unknown;

            if (isPresenceSnapshot(message)) {
              setSnapshot(message);
            }
          } catch {
            // Ignore malformed realtime payloads from the server.
          }
        });

        socket.addEventListener("close", () => {
          if (heartbeatTimer) {
            window.clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }

          if (!cancelled) {
            reconnectTimer = window.setTimeout(() => {
              void connect();
            }, 1_500);
          }
        });
      } catch {
        // Ignore transient connection failures and rely on the reconnect timer.
      }
    }

    function sendPresenceUpdate(type: "presence:update" | "presence:heartbeat") {
      const socket = socketRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
      }

      const metrics = readPresenceMetrics();
      setSelfMetrics(metrics);
      lastSentProgressRef.current = metrics.progressPercent;
      socket.send(
        JSON.stringify({
          type,
          payload: {
            pathname,
            ...metrics,
          },
        }),
      );
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        setSelfMetrics(readPresenceMetrics());
        sendPresenceUpdate("presence:update");
      }
    }

    function handlePageHide() {
      sendPresenceUpdate("presence:update");
    }

    function handleScrollLikeChange() {
      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(syncSelfMetrics);
      }

      throttledPresenceSync();
    }

    setSelfMetrics(readPresenceMetrics());
    window.addEventListener("scroll", handleScrollLikeChange, { passive: true });
    window.addEventListener("resize", handleScrollLikeChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    void connect();

    return () => {
      cancelled = true;

      if (heartbeatTimer) {
        window.clearInterval(heartbeatTimer);
      }

      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      throttledPresenceSync.cancel();
      window.removeEventListener("scroll", handleScrollLikeChange);
      window.removeEventListener("resize", handleScrollLikeChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [pathname, postId, postSlug, realtimePort]);

  const otherReaders = snapshot?.readers.filter((reader) => reader.sessionKey !== selfSessionKey) ?? [];
  const selfReader = selfSessionKey
    ? {
        sessionKey: selfSessionKey,
        label: selfDisplayName?.trim() || "You",
        progressPercent: selfMetrics.progressPercent,
        currentHeading: selfMetrics.currentHeading,
        connectedAt: 0,
        lastSeenAt: 0,
      }
    : null;

  if (!otherReaders.length && !selfReader) {
    return null;
  }

  const tooltipReaders: RailReader[] = [
    ...(selfReader ? [selfReader] : []),
    ...otherReaders,
  ];
  const groupedReaders = groupReadersByProgress(tooltipReaders, selfSessionKey);

  return (
    <div
      className="fixed inset-y-0 left-0 z-20 hidden md:block"
      aria-hidden="true"
      onMouseEnter={() => setIsRailHovered(true)}
      onMouseLeave={() => setIsRailHovered(false)}
    >
      <div className="absolute bottom-14 left-0 top-32 flex w-8 items-stretch">
        <div className="relative w-full">
          {groupedReaders.map((group, index) => {
            const railColor = group.includesSelf ? "var(--color-primary)" : getReaderColor(index);
            const groupLabel = getGroupLabel(group, selfSessionKey);
            const groupProgress = Math.round(group.progressPercent);
            const orderedReaders = orderGroupReaders(group.readers, selfSessionKey);

            return (
              <div key={group.id}>
                <div
                  className="absolute left-0 flex h-3 w-3 -translate-y-1/2 items-center justify-start transition-[top] duration-300 ease-out"
                  style={{ top: `${clampPercent(group.progressPercent)}%` }}
                >
                  <span className="block h-3 w-[5px] rounded-full" style={{ backgroundColor: railColor }} />
                </div>

                <div
                  className={
                    isRailHovered
                      ? "pointer-events-none absolute left-5 w-56 -translate-y-1/2 opacity-100 transition-[top,opacity] duration-200 ease-out"
                      : "pointer-events-none absolute left-5 w-56 -translate-y-1/2 opacity-0 transition-[top,opacity] duration-200 ease-out"
                  }
                  style={{ top: `${clampPercent(group.progressPercent)}%` }}
                >
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                      {orderedReaders.slice(0, 3).map((reader, avatarIndex) => {
                        const isSelfReader = selfSessionKey ? reader.sessionKey === selfSessionKey : false;
                        const avatarColor = isSelfReader ? "var(--color-primary)" : getReaderColor(index + avatarIndex);

                        return (
                          <span
                            key={reader.sessionKey}
                            className={`inline-flex size-6 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold text-white ring-2 ring-white dark:ring-zinc-950 ${
                              avatarIndex === 0 ? "" : "-ml-2.5"
                            }`}
                            style={{ backgroundColor: isSelfReader && resolvedSelfAvatarUrl ? "transparent" : avatarColor }}
                          >
                            {isSelfReader && resolvedSelfAvatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={resolvedSelfAvatarUrl}
                                alt={`${reader.label} avatar`}
                                className="size-6 rounded-full object-cover"
                                draggable={false}
                              />
                            ) : (
                              getReaderInitials(isSelfReader ? reader.label || "我" : reader.label)
                            )}
                          </span>
                        );
                      })}
                      {orderedReaders.length > 3 ? (
                        <span className="-ml-2 inline-flex size-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white ring-2 ring-white dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-950">
                          +{orderedReaders.length - 3}
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-4 text-zinc-950 dark:text-zinc-50">
                        {groupLabel}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                        {groupProgress}% read
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function buildRealtimeUrl(port: number) {
  const url = new URL(window.location.href);
  url.protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  url.port = String(port);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url.toString();
}

function readPresenceMetrics(): PresenceMetrics {
  const root = document.querySelector<HTMLElement>(READING_PROGRESS_ROOT_SELECTOR);

  if (!root) {
    return {
      progressPercent: 0,
      currentHeading: null,
    };
  }

  const headings = Array.from(root.querySelectorAll<HTMLElement>("h1[id], h2[id], h3[id], h4[id]"))
    .map((heading) => ({
      title: heading.textContent?.trim() ?? "",
      top: window.scrollY + heading.getBoundingClientRect().top,
    }))
    .filter((heading) => heading.title.length > 0);

  const viewportAnchor = window.scrollY + window.innerHeight * 0.32;
  const currentHeading =
    headings.reduce<string | null>((activeHeading, heading) => {
      if (heading.top <= viewportAnchor) {
        return heading.title;
      }

      return activeHeading;
    }, null) ?? headings[0]?.title ?? null;

  return {
    progressPercent: Math.round(getReadingProgressValue()),
    currentHeading,
  };
}

function getReaderKey(reader: PresenceSnapshot["readers"][number], index = 0) {
  return reader.sessionKey || `${reader.label}-${reader.connectedAt}-${reader.lastSeenAt}-${index}`;
}

function getReaderInitials(label: string) {
  const normalizedLabel = label.trim();
  const readerMatch = normalizedLabel.match(/^Reader\s+(\d+)$/i);

  if (readerMatch) {
    return readerMatch[1].padStart(2, "0");
  }

  if (!normalizedLabel) {
    return "?";
  }

  return normalizedLabel[0].toUpperCase();
}

function getReaderColor(index: number) {
  const palette = ["#14b8a6", "#f97316", "#38bdf8", "#f43f5e", "#8b5cf6", "#eab308"];
  return palette[index % palette.length];
}

function clampPercent(value: number) {
  return Math.max(3, Math.min(97, value));
}

function groupReadersByProgress(readers: RailReader[], selfSessionKey: string | null) {
  const sortedReaders = [...readers].sort((left, right) => left.progressPercent - right.progressPercent);
  const groups: GroupedReader[] = [];
  const minVisualDelta = getMinimumVisualGroupDelta();
  const groupDelta = Math.max(MIN_GROUP_PROGRESS_DELTA, minVisualDelta);

  for (const reader of sortedReaders) {
    const currentGroup = groups[groups.length - 1];

    if (!currentGroup) {
      groups.push(createReaderGroup(reader, selfSessionKey));
      continue;
    }

    if (Math.abs(reader.progressPercent - currentGroup.progressPercent) <= groupDelta) {
      currentGroup.readers.push(reader);
      currentGroup.progressPercent =
        currentGroup.readers.reduce((sum, currentReader) => sum + currentReader.progressPercent, 0) /
        currentGroup.readers.length;
      currentGroup.includesSelf ||= selfSessionKey ? reader.sessionKey === selfSessionKey : false;
      continue;
    }

    groups.push(createReaderGroup(reader, selfSessionKey));
  }

  return groups;
}

function getMinimumVisualGroupDelta() {
  if (typeof window === "undefined") {
    return MIN_GROUP_PROGRESS_DELTA;
  }

  const railHeight = Math.max(1, window.innerHeight - RAIL_TOP_OFFSET_PX - RAIL_BOTTOM_OFFSET_PX);
  return (GROUP_TOOLTIP_HEIGHT_PX / railHeight) * 100;
}

function createReaderGroup(reader: RailReader, selfSessionKey: string | null): GroupedReader {
  const includesSelf = selfSessionKey ? reader.sessionKey === selfSessionKey : false;

  return {
    id: `group:${reader.sessionKey}`,
    readers: [reader],
    progressPercent: reader.progressPercent,
    includesSelf,
  };
}

function getGroupLabel(group: GroupedReader, selfSessionKey: string | null) {
  if (group.readers.length === 1) {
    const [reader] = group.readers;
    return selfSessionKey && reader.sessionKey === selfSessionKey ? "你" : reader.label;
  }

  if (group.includesSelf) {
    return `你及其他 ${group.readers.length - 1} 人`;
  }

  return `${group.readers.length} 人`;
}

function orderGroupReaders(readers: RailReader[], selfSessionKey: string | null) {
  if (!selfSessionKey) {
    return readers;
  }

  const selfIndex = readers.findIndex((reader) => reader.sessionKey === selfSessionKey);

  if (selfIndex <= 0) {
    return readers;
  }

  const nextReaders = [...readers];
  const [selfReader] = nextReaders.splice(selfIndex, 1);
  nextReaders.unshift(selfReader);
  return nextReaders;
}

function isPresenceSnapshot(value: unknown): value is PresenceSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (value as { type?: string }).type === "presence:snapshot";
}

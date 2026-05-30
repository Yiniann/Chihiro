"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { PRESENCE_HEARTBEAT_INTERVAL_MS } from "@/lib/live-presence";
import { getOrCreatePresenceTabId } from "@/lib/presence-tab-id";

export function SitePresenceTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const tabId = getOrCreatePresenceTabId();

    async function sendHeartbeat() {
      try {
        await fetch("/api/presence/heartbeat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tabId,
            pathname,
          }),
          cache: "no-store",
        });
      } catch {
        // Ignore transient presence failures.
      }
    }

    void sendHeartbeat();
    const intervalId = window.setInterval(() => {
      void sendHeartbeat();
    }, PRESENCE_HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat();
      }
    };

    window.addEventListener("focus", sendHeartbeat);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", sendHeartbeat);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname]);

  return null;
}

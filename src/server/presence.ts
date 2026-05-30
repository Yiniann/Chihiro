import "server-only";

import { PRESENCE_SESSION_TTL_SECONDS } from "@/lib/live-presence";
import { connectRedisClient } from "@/server/redis";

const PRESENCE_KEYS = {
  siteTabs: "presence:site:tabs",
  siteVisitors: "presence:site:visitors",
};

export async function getSitePresenceSummary() {
  const redis = await connectRedisClient();
  const staleBefore = Date.now() - PRESENCE_SESSION_TTL_SECONDS * 1000;

  await redis
    .multi()
    .zRemRangeByScore(PRESENCE_KEYS.siteTabs, 0, staleBefore)
    .zRemRangeByScore(PRESENCE_KEYS.siteVisitors, 0, staleBefore)
    .exec();

  const [activeSessions, onlineVisitors] = await Promise.all([
    redis.zCard(PRESENCE_KEYS.siteTabs),
    redis.zCard(PRESENCE_KEYS.siteVisitors),
  ]);

  return {
    onlineVisitors,
    activeSessions,
    generatedAt: Date.now(),
  };
}

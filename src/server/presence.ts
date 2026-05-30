import "server-only";

import { PRESENCE_SESSION_TTL_SECONDS } from "@/lib/live-presence";
import { connectRedisClient } from "@/server/redis";

const PRESENCE_ANALYTICS_TTL_SECONDS = 60 * 60 * 24 * 3;
const PRESENCE_ANALYTICS_TIME_ZONE = "Asia/Shanghai";

const PRESENCE_KEYS = {
  siteTabs: "presence:site:tabs",
  siteVisitors: "presence:site:visitors",
  dayVisitors: (dayKey: string) => `presence:stats:${dayKey}:visitors`,
  dayPeakOnlineVisitors: (dayKey: string) => `presence:stats:${dayKey}:peak-online-visitors`,
};

export async function getSitePresenceSummary() {
  const redis = await connectRedisClient();
  const staleBefore = Date.now() - PRESENCE_SESSION_TTL_SECONDS * 1000;
  const dayKey = getPresenceDayKey();

  await redis
    .multi()
    .zRemRangeByScore(PRESENCE_KEYS.siteTabs, 0, staleBefore)
    .zRemRangeByScore(PRESENCE_KEYS.siteVisitors, 0, staleBefore)
    .exec();

  const [activeSessions, onlineVisitors, todayVisitors, todayPeakOnlineVisitors] = await Promise.all([
    redis.zCard(PRESENCE_KEYS.siteTabs),
    redis.zCard(PRESENCE_KEYS.siteVisitors),
    redis.sCard(PRESENCE_KEYS.dayVisitors(dayKey)),
    redis.get(PRESENCE_KEYS.dayPeakOnlineVisitors(dayKey)),
  ]);

  return {
    onlineVisitors,
    activeSessions,
    todayVisitors,
    todayPeakOnlineVisitors: Number(todayPeakOnlineVisitors ?? 0),
    generatedAt: Date.now(),
  };
}

export async function trackPresenceVisit(visitorId: string, now = Date.now()) {
  const redis = await connectRedisClient();
  const dayKey = getPresenceDayKey(now);

  await redis
    .multi()
    .sAdd(PRESENCE_KEYS.dayVisitors(dayKey), visitorId)
    .expire(PRESENCE_KEYS.dayVisitors(dayKey), PRESENCE_ANALYTICS_TTL_SECONDS)
    .exec();
}

export async function updatePresencePeakFromRedis(now = Date.now()) {
  const redis = await connectRedisClient();
  const dayKey = getPresenceDayKey(now);
  const onlineVisitors = await redis.zCard(PRESENCE_KEYS.siteVisitors);

  await updatePresencePeakValue(redis, dayKey, onlineVisitors);

  return onlineVisitors;
}

export function getPresenceDayKey(now = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PRESENCE_ANALYTICS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

async function updatePresencePeakValue(
  redis: Awaited<ReturnType<typeof connectRedisClient>>,
  dayKey: string,
  onlineVisitors: number,
) {
  const peakKey = PRESENCE_KEYS.dayPeakOnlineVisitors(dayKey);
  const currentPeak = Number((await redis.get(peakKey)) ?? 0);

  if (onlineVisitors <= currentPeak) {
    return;
  }

  await redis
    .multi()
    .set(peakKey, String(onlineVisitors))
    .expire(peakKey, PRESENCE_ANALYTICS_TTL_SECONDS)
    .exec();
}

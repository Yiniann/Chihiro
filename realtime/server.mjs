import { createServer } from "node:http";
import { createClient } from "redis";
import { WebSocket, WebSocketServer } from "ws";

const REALTIME_PORT = Number(process.env.REALTIME_PORT ?? 3001);
const SESSION_TTL_SECONDS = 300;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;
const PRESENCE_ANALYTICS_TTL_SECONDS = 60 * 60 * 24 * 3;
const PRESENCE_ANALYTICS_TIME_ZONE = "Asia/Shanghai";

const PRESENCE_KEYS = {
  siteTabs: "presence:site:tabs",
  siteVisitors: "presence:site:visitors",
  contentTabs: (contentType, contentId) => `presence:${contentType}:${contentId}:tabs`,
  session: (tabId) => `presence:session:${tabId}`,
  visitorTabs: (visitorId) => `presence:visitor:${visitorId}:tabs`,
  dayVisitors: (dayKey) => `presence:stats:${dayKey}:visitors`,
  dayPeakOnlineVisitors: (dayKey) => `presence:stats:${dayKey}:peak-online-visitors`,
};

const redis = createClient({
  url: process.env.REDIS_URL ?? process.env.DOCKER_REDIS_URL ?? "redis://127.0.0.1:6379",
});

redis.on("error", (error) => {
  console.error("[presence] redis error", error);
});

await redis.connect();

const subscriptionsByContent = new Map();
const sessionBySocket = new WeakMap();

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  response.writeHead(404);
  response.end();
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket, request) => {
  socket.on("message", async (rawMessage) => {
    let message;

    try {
      message = JSON.parse(rawMessage.toString());
    } catch {
      socket.send(JSON.stringify({ type: "presence:error", message: "Invalid JSON payload." }));
      return;
    }

    try {
      if (message.type === "presence:join") {
        const session = normalizeJoinMessage(message.payload, request.headers.cookie ?? "");

        if (!session) {
          socket.send(JSON.stringify({ type: "presence:error", message: "Invalid presence join payload." }));
          return;
        }

        sessionBySocket.set(socket, session);
        registerSocketForContent(socket, session.contentType, session.contentId);
        await upsertSession(session);
        await trackPresenceVisit(session.visitorId, session.lastSeenAt);
        await updatePresencePeak(session.lastSeenAt);
        await broadcastSnapshot(session.contentType, session.contentId);
        return;
      }

      if (message.type === "presence:update" || message.type === "presence:heartbeat") {
        const existingSession = sessionBySocket.get(socket);

        if (!existingSession) {
          socket.send(JSON.stringify({ type: "presence:error", message: "Join is required before updates." }));
          return;
        }

        const nextSession = applyPresenceUpdate(existingSession, message.payload);
        sessionBySocket.set(socket, nextSession);
        await upsertSession(nextSession);
        await trackPresenceVisit(nextSession.visitorId, nextSession.lastSeenAt);
        await updatePresencePeak(nextSession.lastSeenAt);
        await broadcastSnapshot(nextSession.contentType, nextSession.contentId);
      }
    } catch (error) {
      console.error("[presence] failed to handle socket message", error);
      socket.send(JSON.stringify({ type: "presence:error", message: "Presence update failed." }));
    }
  });

  socket.on("close", async () => {
    const session = sessionBySocket.get(socket);

    if (!session) {
      return;
    }

    unregisterSocketForContent(socket, session.contentType, session.contentId);
    sessionBySocket.delete(socket);
    await removeSession(session);
    await broadcastSnapshot(session.contentType, session.contentId);
  });
});

server.listen(REALTIME_PORT, "0.0.0.0", () => {
  console.log(`[presence] websocket server listening on :${REALTIME_PORT}`);
});

function normalizeJoinMessage(payload, cookieHeader) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const contentType = normalizeContentType(payload.contentType);
  const contentId = Number(payload.contentId);
  const contentSlug = normalizeString(payload.contentSlug, 1, 200);
  const pathname = normalizeString(payload.pathname, 1, 500);
  const tabId = normalizeString(payload.tabId, 6, 128);
  const visitorId =
    normalizeString(payload.visitorId, 6, 128) ?? readCookie(cookieHeader, "chihiro_visitor_id");

  if (!contentType || !Number.isInteger(contentId) || contentId <= 0 || !contentSlug || !pathname || !tabId || !visitorId) {
    return null;
  }

  const now = Date.now();

  return {
    contentType,
    contentId,
    contentSlug,
    pathname,
    tabId,
    visitorId,
    referrer: normalizeString(payload.referrer, 0, 500),
    currentHeading: normalizeString(payload.currentHeading, 0, 240),
    progressPercent: normalizeProgress(payload.progressPercent),
    connectedAt: now,
    lastSeenAt: now,
  };
}

function applyPresenceUpdate(session, payload) {
  return {
    ...session,
    pathname: normalizeString(payload?.pathname, 1, 500) ?? session.pathname,
    currentHeading: normalizeString(payload?.currentHeading, 0, 240),
    progressPercent: normalizeProgress(payload?.progressPercent, session.progressPercent),
    lastSeenAt: Date.now(),
  };
}

async function upsertSession(session) {
  const now = Date.now();

  await redis
    .multi()
    .set(PRESENCE_KEYS.session(session.tabId), JSON.stringify(session), {
      EX: SESSION_TTL_SECONDS,
    })
    .zAdd(PRESENCE_KEYS.siteTabs, [{ score: now, value: session.tabId }])
    .zAdd(PRESENCE_KEYS.siteVisitors, [{ score: now, value: session.visitorId }])
    .zAdd(PRESENCE_KEYS.contentTabs(session.contentType, session.contentId), [{ score: now, value: session.tabId }])
    .zAdd(PRESENCE_KEYS.visitorTabs(session.visitorId), [{ score: now, value: session.tabId }])
    .expire(PRESENCE_KEYS.visitorTabs(session.visitorId), SESSION_TTL_SECONDS)
    .exec();
}

async function removeSession(session) {
  const visitorTabsKey = PRESENCE_KEYS.visitorTabs(session.visitorId);
  await redis
    .multi()
    .del(PRESENCE_KEYS.session(session.tabId))
    .zRem(PRESENCE_KEYS.siteTabs, session.tabId)
    .zRem(PRESENCE_KEYS.contentTabs(session.contentType, session.contentId), session.tabId)
    .zRem(visitorTabsKey, session.tabId)
    .exec();

  await redis.zRemRangeByScore(visitorTabsKey, 0, Date.now() - SESSION_TTL_MS);

  if ((await redis.zCard(visitorTabsKey)) === 0) {
    await redis.zRem(PRESENCE_KEYS.siteVisitors, session.visitorId);
  }
}

async function broadcastSnapshot(contentType, contentId) {
  const contentKey = getContentKey(contentType, contentId);
  const sockets = subscriptionsByContent.get(contentKey);

  if (!sockets || sockets.size === 0) {
    return;
  }

  const snapshot = await buildSnapshot(contentType, contentId);
  const payload = JSON.stringify(snapshot);

  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}

async function buildSnapshot(contentType, contentId) {
  const now = Date.now();
  const staleBefore = now - SESSION_TTL_MS;
  const siteTabsKey = PRESENCE_KEYS.siteTabs;
  const siteVisitorsKey = PRESENCE_KEYS.siteVisitors;
  const contentTabsKey = PRESENCE_KEYS.contentTabs(contentType, contentId);

  await redis
    .multi()
    .zRemRangeByScore(siteTabsKey, 0, staleBefore)
    .zRemRangeByScore(siteVisitorsKey, 0, staleBefore)
    .zRemRangeByScore(contentTabsKey, 0, staleBefore)
    .exec();

  const [siteActiveSessions, siteOnlineVisitors, contentTabIds] = await Promise.all([
    redis.zCard(siteTabsKey),
    redis.zCard(siteVisitorsKey),
    redis.zRange(contentTabsKey, 0, -1),
  ]);

  const sessions = await hydrateSessions(contentType, contentId, contentTabIds, staleBefore);
  const uniqueVisitors = new Set(sessions.map((session) => session.visitorId));
  const readers = sessions
    .sort((left, right) => left.connectedAt - right.connectedAt)
    .map((session, index) => ({
      sessionKey: session.tabId,
      label: `Reader ${String(index + 1).padStart(2, "0")}`,
      progressPercent: session.progressPercent,
      currentHeading: session.currentHeading,
      connectedAt: session.connectedAt,
      lastSeenAt: session.lastSeenAt,
    }));

  return {
    type: "presence:snapshot",
    contentType,
    contentId,
    contentSlug: sessions[0]?.contentSlug ?? "",
    pathname: sessions[0]?.pathname ?? "",
    siteOnlineVisitors,
    siteActiveSessions,
    contentOnlineVisitors: uniqueVisitors.size,
    contentActiveSessions: sessions.length,
    readers,
    distribution: buildDistribution(readers),
    generatedAt: now,
  };
}

async function hydrateSessions(contentType, contentId, tabIds, staleBefore) {
  if (tabIds.length === 0) {
    return [];
  }

  const sessionKeys = tabIds.map((tabId) => PRESENCE_KEYS.session(tabId));
  const rows = await redis.mGet(sessionKeys);
  const staleTabIds = [];
  const sessions = [];

  rows.forEach((row, index) => {
    if (!row) {
      staleTabIds.push(tabIds[index]);
      return;
    }

    try {
      const session = JSON.parse(row);

      if (
        !session ||
        session.contentType !== contentType ||
        session.contentId !== contentId ||
        session.lastSeenAt < staleBefore
      ) {
        staleTabIds.push(tabIds[index]);
        return;
      }

      sessions.push(session);
    } catch {
      staleTabIds.push(tabIds[index]);
    }
  });

  if (staleTabIds.length > 0) {
    await redis.zRem(PRESENCE_KEYS.contentTabs(contentType, contentId), staleTabIds);
  }

  return sessions;
}

function buildDistribution(readers) {
  const buckets = [
    { id: "early", label: "0-25%", min: 0, max: 25, count: 0 },
    { id: "steady", label: "25-50%", min: 25, max: 50, count: 0 },
    { id: "deep", label: "50-75%", min: 50, max: 75, count: 0 },
    { id: "finish", label: "75-100%", min: 75, max: 101, count: 0 },
  ];

  for (const reader of readers) {
    const bucket =
      buckets.find((entry) => reader.progressPercent >= entry.min && reader.progressPercent < entry.max) ??
      buckets[buckets.length - 1];
    bucket.count += 1;
  }

  return buckets;
}

function registerSocketForContent(socket, contentType, contentId) {
  const previousSession = sessionBySocket.get(socket);

  unregisterSocketForContent(socket, previousSession?.contentType, previousSession?.contentId);

  const contentKey = getContentKey(contentType, contentId);
  const sockets = subscriptionsByContent.get(contentKey) ?? new Set();
  sockets.add(socket);
  subscriptionsByContent.set(contentKey, sockets);
}

function unregisterSocketForContent(socket, contentType, contentId) {
  if (!contentType || !contentId) {
    return;
  }

  const contentKey = getContentKey(contentType, contentId);
  const sockets = subscriptionsByContent.get(contentKey);

  if (!sockets) {
    return;
  }

  sockets.delete(socket);

  if (sockets.size === 0) {
    subscriptionsByContent.delete(contentKey);
  }
}

function getContentKey(contentType, contentId) {
  return `${contentType}:${contentId}`;
}

function normalizeContentType(value) {
  if (value === "post" || value === "standalone-page") {
    return value;
  }

  return null;
}

async function trackPresenceVisit(visitorId, now = Date.now()) {
  const dayKey = getPresenceDayKey(now);

  await redis
    .multi()
    .sAdd(PRESENCE_KEYS.dayVisitors(dayKey), visitorId)
    .expire(PRESENCE_KEYS.dayVisitors(dayKey), PRESENCE_ANALYTICS_TTL_SECONDS)
    .exec();
}

async function updatePresencePeak(now = Date.now()) {
  const dayKey = getPresenceDayKey(now);
  const onlineVisitors = await redis.zCard(PRESENCE_KEYS.siteVisitors);
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

function getPresenceDayKey(now = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PRESENCE_ANALYTICS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

function normalizeString(value, minLength, maxLength) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length < minLength || trimmedValue.length > maxLength) {
    return null;
  }

  return trimmedValue;
}

function normalizeProgress(value, fallback = 0) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function readCookie(cookieHeader, name) {
  const pattern = new RegExp(`(?:^|; )${name}=([^;]+)`);
  const match = cookieHeader.match(pattern);
  return match ? decodeURIComponent(match[1]) : null;
}

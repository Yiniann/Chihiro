import { createServer } from "node:http";
import { createClient } from "redis";
import { WebSocket, WebSocketServer } from "ws";

const REALTIME_PORT = Number(process.env.REALTIME_PORT ?? 3001);
const SESSION_TTL_SECONDS = 300;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

const PRESENCE_KEYS = {
  siteTabs: "presence:site:tabs",
  siteVisitors: "presence:site:visitors",
  postTabs: (postId) => `presence:post:${postId}:tabs`,
  session: (tabId) => `presence:session:${tabId}`,
  visitorTabs: (visitorId) => `presence:visitor:${visitorId}:tabs`,
};

const redis = createClient({
  url: process.env.REDIS_URL ?? process.env.DOCKER_REDIS_URL ?? "redis://127.0.0.1:6379",
});

redis.on("error", (error) => {
  console.error("[presence] redis error", error);
});

await redis.connect();

const subscriptionsByPost = new Map();
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
        registerSocketForPost(socket, session.postId);
        await upsertSession(session);
        await broadcastSnapshot(session.postId);
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
        await broadcastSnapshot(nextSession.postId);
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

    unregisterSocketForPost(socket, session.postId);
    sessionBySocket.delete(socket);
    await removeSession(session);
    await broadcastSnapshot(session.postId);
  });
});

server.listen(REALTIME_PORT, "0.0.0.0", () => {
  console.log(`[presence] websocket server listening on :${REALTIME_PORT}`);
});

function normalizeJoinMessage(payload, cookieHeader) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const postId = Number(payload.postId);
  const postSlug = normalizeString(payload.postSlug, 1, 200);
  const pathname = normalizeString(payload.pathname, 1, 500);
  const tabId = normalizeString(payload.tabId, 6, 128);
  const visitorId =
    normalizeString(payload.visitorId, 6, 128) ?? readCookie(cookieHeader, "chihiro_visitor_id");

  if (!Number.isInteger(postId) || postId <= 0 || !postSlug || !pathname || !tabId || !visitorId) {
    return null;
  }

  const now = Date.now();

  return {
    postId,
    postSlug,
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
    .zAdd(PRESENCE_KEYS.postTabs(session.postId), [{ score: now, value: session.tabId }])
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
    .zRem(PRESENCE_KEYS.postTabs(session.postId), session.tabId)
    .zRem(visitorTabsKey, session.tabId)
    .exec();

  await redis.zRemRangeByScore(visitorTabsKey, 0, Date.now() - SESSION_TTL_MS);

  if ((await redis.zCard(visitorTabsKey)) === 0) {
    await redis.zRem(PRESENCE_KEYS.siteVisitors, session.visitorId);
  }
}

async function broadcastSnapshot(postId) {
  const sockets = subscriptionsByPost.get(postId);

  if (!sockets || sockets.size === 0) {
    return;
  }

  const snapshot = await buildSnapshot(postId);
  const payload = JSON.stringify(snapshot);

  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(payload);
    }
  }
}

async function buildSnapshot(postId) {
  const now = Date.now();
  const staleBefore = now - SESSION_TTL_MS;
  const siteTabsKey = PRESENCE_KEYS.siteTabs;
  const siteVisitorsKey = PRESENCE_KEYS.siteVisitors;
  const postTabsKey = PRESENCE_KEYS.postTabs(postId);

  await redis
    .multi()
    .zRemRangeByScore(siteTabsKey, 0, staleBefore)
    .zRemRangeByScore(siteVisitorsKey, 0, staleBefore)
    .zRemRangeByScore(postTabsKey, 0, staleBefore)
    .exec();

  const [siteActiveSessions, siteOnlineVisitors, postTabIds] = await Promise.all([
    redis.zCard(siteTabsKey),
    redis.zCard(siteVisitorsKey),
    redis.zRange(postTabsKey, 0, -1),
  ]);

  const sessions = await hydrateSessions(postId, postTabIds, staleBefore);
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
    postId,
    postSlug: sessions[0]?.postSlug ?? "",
    pathname: sessions[0]?.pathname ?? "",
    siteOnlineVisitors,
    siteActiveSessions,
    postOnlineVisitors: uniqueVisitors.size,
    postActiveSessions: sessions.length,
    readers,
    distribution: buildDistribution(readers),
    generatedAt: now,
  };
}

async function hydrateSessions(postId, tabIds, staleBefore) {
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

      if (!session || session.postId !== postId || session.lastSeenAt < staleBefore) {
        staleTabIds.push(tabIds[index]);
        return;
      }

      sessions.push(session);
    } catch {
      staleTabIds.push(tabIds[index]);
    }
  });

  if (staleTabIds.length > 0) {
    await redis.zRem(PRESENCE_KEYS.postTabs(postId), staleTabIds);
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

function registerSocketForPost(socket, postId) {
  unregisterSocketForPost(socket, sessionBySocket.get(socket)?.postId);

  const sockets = subscriptionsByPost.get(postId) ?? new Set();
  sockets.add(socket);
  subscriptionsByPost.set(postId, sockets);
}

function unregisterSocketForPost(socket, postId) {
  if (!postId) {
    return;
  }

  const sockets = subscriptionsByPost.get(postId);

  if (!sockets) {
    return;
  }

  sockets.delete(socket);

  if (sockets.size === 0) {
    subscriptionsByPost.delete(postId);
  }
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

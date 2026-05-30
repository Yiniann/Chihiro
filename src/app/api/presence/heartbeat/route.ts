import { NextResponse } from "next/server";
import { connectRedisClient } from "@/server/redis";
import { getOrCreateVisitorId } from "@/server/visitor";

const SESSION_TTL_SECONDS = 300;
const PRESENCE_KEYS = {
  siteTabs: "presence:site:tabs",
  siteVisitors: "presence:site:visitors",
};

type PresenceHeartbeatPayload = {
  tabId?: unknown;
  pathname?: unknown;
};

export async function POST(request: Request) {
  const payload = (await readJson(request)) as PresenceHeartbeatPayload | null;
  const tabId = normalizeString(payload?.tabId, 6, 128);

  if (!tabId) {
    return NextResponse.json({ error: "Invalid tab id." }, { status: 400 });
  }

  const response = NextResponse.json({}, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
  const visitorId = await getOrCreateVisitorId(response);
  const redis = await connectRedisClient();
  const now = Date.now();

  await redis
    .multi()
    .zAdd(PRESENCE_KEYS.siteTabs, [{ score: now, value: tabId }])
    .zAdd(PRESENCE_KEYS.siteVisitors, [{ score: now, value: visitorId }])
    .expire(PRESENCE_KEYS.siteTabs, SESSION_TTL_SECONDS)
    .expire(PRESENCE_KEYS.siteVisitors, SESSION_TTL_SECONDS)
    .exec();

  return NextResponse.json(
    {
      visitorId,
      pathname: normalizeString(payload?.pathname, 0, 500),
    },
    {
      headers: response.headers,
    },
  );
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeString(value: unknown, minLength: number, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length < minLength || trimmedValue.length > maxLength) {
    return null;
  }

  return trimmedValue;
}

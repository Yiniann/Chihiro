import "server-only";

import { createClient } from "redis";

declare global {
  var __chihiroRedisClient: ReturnType<typeof createClient> | undefined;
}

export function getRedisUrl() {
  const redisUrl = process.env.REDIS_URL ?? process.env.DOCKER_REDIS_URL;

  if (!redisUrl) {
    throw new Error("REDIS_URL is not configured.");
  }

  return redisUrl;
}

export function getRedisClient() {
  if (!globalThis.__chihiroRedisClient) {
    globalThis.__chihiroRedisClient = createClient({
      url: getRedisUrl(),
    });

    globalThis.__chihiroRedisClient.on("error", (error) => {
      console.error("Redis client error", error);
    });
  }

  return globalThis.__chihiroRedisClient;
}

export async function connectRedisClient() {
  const client = getRedisClient();

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

import Redis from "ioredis";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL;

  let client: Redis;
  if (redisUrl) {
    logger.info("Creating Redis client with URL");
    client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 2000);
        logger.info("Redis retry attempt", { times, delay });
        return delay;
      },
      reconnectOnError: () => true,
    });
  } else {
    logger.info("Creating Redis client with individual config");
    client = new Redis({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD || undefined,
      tls: {},
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 100, 2000);
        return delay;
      },
    });
  }

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

redis.on("connect", () => {
  logger.info("Redis: connect event fired");
});

redis.on("ready", () => {
  logger.info("Redis: ready event - connection fully established");
});

redis.on("error", (err: Error & { code?: string }) => {
  logger.error("Redis error", { error: err.message, code: err.code });
});

redis.on("close", () => {
  logger.warn("Redis: connection closed");
});

redis.on("reconnecting", () => {
  logger.info("Redis: reconnecting...");
});

export default redis;

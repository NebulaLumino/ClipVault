import { redis } from "../db/redis.js";
import { logger } from "./logger.js";

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export class RateLimiter {
  private defaultLimit: number;
  private defaultWindowMs: number;

  constructor(defaultLimit = 10, defaultWindowMs = 60000) {
    this.defaultLimit = defaultLimit;
    this.defaultWindowMs = defaultWindowMs;
  }

  async check(
    key: string,
    limit?: number,
    windowMs?: number,
  ): Promise<RateLimitResult> {
    const effectiveLimit = limit || this.defaultLimit;
    const effectiveWindowMs = windowMs || this.defaultWindowMs;
    const now = Date.now();

    try {
      const redisKey = `ratelimit:${key}`;

      const currentCountStr = await redis.get(redisKey);
      const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

      const success = currentCount < effectiveLimit;
      const remaining = Math.max(0, effectiveLimit - currentCount - 1);
      const resetAt = now + effectiveWindowMs;

      if (success) {
        await redis.set(
          redisKey,
          String(currentCount + 1),
          "EX",
          Math.ceil(effectiveWindowMs / 1000),
        );
      } else {
        logger.warn("Rate limit exceeded", {
          key,
          limit: effectiveLimit,
          current: currentCount,
        });
      }

      return { success, remaining, resetAt };
    } catch (error) {
      logger.error("Rate limit check failed", { key, error: String(error) });
      return {
        success: true,
        remaining: effectiveLimit,
        resetAt: now + effectiveWindowMs,
      };
    }
  }

  async checkAndThrow(
    key: string,
    limit?: number,
    windowMs?: number,
  ): Promise<void> {
    const result = await this.check(key, limit, windowMs);
    if (!result.success) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
      const error = new Error(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      ) as Error & { statusCode: number; retryAfter: number };
      error.statusCode = 429;
      error.retryAfter = retryAfter;
      throw error;
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await redis.del(`ratelimit:${key}`);
    } catch (error) {
      logger.error("Failed to reset rate limit", { key, error: String(error) });
    }
  }
}

export const rateLimiter = new RateLimiter();

export function createRateLimitMiddleware(limit: number, windowMs: number) {
  return async (key: string): Promise<void> => {
    await rateLimiter.checkAndThrow(key, limit, windowMs);
  };
}

/**
 * Rate limiting helper.
 * Uses Upstash Redis if configured, otherwise falls back to an in-memory sliding window algorithm.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "../config/env";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class InMemoryRateLimiter {
  private cache = new Map<string, { timestamps: number[] }>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 60, windowMs = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let record = this.cache.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.cache.set(key, record);
    }

    // Filter out old timestamps outside the window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0] ?? now;
      const reset = Math.ceil((oldest + this.windowMs) / 1000); // Unix timestamp in seconds
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset,
      };
    }

    record.timestamps.push(now);
    const remaining = this.maxRequests - record.timestamps.length;
    return {
      success: true,
      limit: this.maxRequests,
      remaining,
      reset: Math.ceil((now + this.windowMs) / 1000),
    };
  }

  // Periodic cleanup of stale keys
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, record] of this.cache.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
      if (record.timestamps.length === 0) {
        this.cache.delete(key);
      }
    }
  }
}

// Global instance for the process
const globalInMemoryLimiter = new InMemoryRateLimiter(60, 60_000); // 60 req/min default

let upstashRatelimit: Ratelimit | null = null;
if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  upstashRatelimit = new Ratelimit({
    redis: new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    analytics: true,
  });
}

export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  if (upstashRatelimit) {
    try {
      const res = await upstashRatelimit.limit(key);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        reset: Math.ceil(res.reset / 1000), // Unix timestamp in seconds
      };
    } catch (error) {
      console.error("Upstash rate limit error, falling back to memory:", error);
      // Fallback to in-memory if redis fails
    }
  }
  
  return globalInMemoryLimiter.check(key);
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

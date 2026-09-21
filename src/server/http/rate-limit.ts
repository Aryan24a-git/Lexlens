/**
 * Rate limiting helper.
 * Uses an in-memory sliding window algorithm (or Upstash Redis if configured).
 */

interface RateLimitRecord {
  timestamps: number[];
}

class InMemoryRateLimiter {
  private cache = new Map<string, RateLimitRecord>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 60, windowMs = 60_000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(key: string): { success: boolean; limit: number; remaining: number; reset: number } {
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
      const reset = Math.ceil((oldest + this.windowMs - now) / 1000);
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
      reset: Math.ceil(this.windowMs / 1000),
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
const globalLimiter = new InMemoryRateLimiter(60, 60_000); // 60 req/min default

export function checkRateLimit(key: string): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  return globalLimiter.check(key);
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

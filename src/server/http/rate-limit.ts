/**
 * Rate limiting has been disabled as per user request to simplify deployment.
 * This file now only provides IP extraction for logging purposes.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(_key: string): Promise<RateLimitResult> {
  return {
    success: true,
    limit: 1000,
    remaining: 1000,
    reset: Math.ceil((Date.now() + 60_000) / 1000),
  };
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

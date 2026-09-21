/**
 * retry.ts — exponential backoff with jitter for LLM API calls.
 * Source: code-structure §4, tech-stack §4
 */

import { makeError, type AppError } from "@/lib/result";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** HTTP status codes or error codes that are retryable */
  retryableCodes?: Set<number | string>;
}

const DEFAULT_RETRYABLE_CODES = new Set([429, 500, 502, 503, 504, "ETIMEDOUT"]);

/**
 * Retry an async operation with exponential backoff + full jitter.
 * Throws AppError on final failure.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30_000,
    retryableCodes = DEFAULT_RETRYABLE_CODES,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastError = e;

      if (attempt === maxAttempts) break;

      // Check if retryable
      const code = extractCode(e);
      if (code !== null && !retryableCodes.has(code)) break;

      // Full jitter backoff: random between 0 and min(maxDelay, base * 2^attempt)
      const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const delay = Math.random() * cap;
      await sleep(delay);
    }
  }

  throw wrapError(lastError);
}

function extractCode(e: unknown): number | string | null {
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;
    if (typeof obj["status"] === "number") return obj["status"];
    if (typeof obj["code"] === "string") return obj["code"];
  }
  return null;
}

function wrapError(e: unknown): AppError {
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;
    const status = obj["status"] as number | undefined;
    if (status === 429) {
      return makeError("LLM_RATE_LIMITED", "The AI service is busy. Please try again shortly.", true, e);
    }
    if (status !== undefined && status >= 500) {
      return makeError("LLM_UNAVAILABLE", "The AI service is temporarily unavailable.", true, e);
    }
  }
  return makeError("LLM_UNAVAILABLE", "The AI request failed after multiple retries.", false, e);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

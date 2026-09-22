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
    maxAttempts = 5,
    baseDelayMs = 1500,
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

      // Extract retry-after if available on 429
      const retryAfterMs = extractRetryAfter(e);
      if (retryAfterMs !== null) {
        await sleep(retryAfterMs + 1500);
      } else if (code === 429) {
        // Fallback for TPM window exhaustion on Groq
        await sleep(Math.max(2500 * attempt, baseDelayMs * 2 ** attempt));
      } else {
        // Full jitter backoff
        const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
        const delay = Math.random() * cap;
        await sleep(delay);
      }
    }
  }

  throw wrapError(lastError);
}

function extractRetryAfter(e: unknown): number | null {
  if (typeof e === "object" && e !== null) {
    const obj = e as Record<string, unknown>;
    const headers = obj["headers"] as any;
    if (headers) {
      if (typeof headers.get === "function") {
        const header = headers.get("retry-after");
        if (header) {
          const secs = parseFloat(header);
          if (!isNaN(secs)) return secs * 1000;
        }
      }
      if (typeof headers["retry-after"] === "string") {
        const secs = parseFloat(headers["retry-after"]);
        if (!isNaN(secs)) return secs * 1000;
      }
    }
    const message = (obj["message"] as string) || "";
    const match = message.match(/try again in ([\d\.]+)s/i);
    if (match && match[1]) {
      const secs = parseFloat(match[1]);
      if (!isNaN(secs)) return secs * 1000;
    }
  }
  return null;
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

/**
 * API middleware/wrapper helper.
 * Enforces body size limits, rate limiting, request IDs, and privacy-safe logging.
 */

import { NextResponse } from "next/server";
import { getOrGenerateRequestId } from "./request-id";
import { checkRateLimit, getClientIp } from "./rate-limit";
import { createErrorResponse } from "./errors";
import { makeError } from "@/lib/result";
import { env } from "../config/env";

export interface ApiContext {
  requestId: string;
  clientIp: string;
}

export interface PrivacyLogMetadata {
  requestId: string;
  route: string;
  latencyMs: number;
  status: number;
  clauseCount?: number;
  model?: string;
  verifiedRatio?: number;
  error?: string;
}

/**
 * Logs structured metadata safely without ever outputting document text or user inputs.
 */
export function logApiMetrics(meta: PrivacyLogMetadata): void {
  // Safe structured JSON log format (architecture.md §10)
  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...meta,
  });
  console.log(`[API_METRIC] ${logEntry}`);
}

/**
 * Validates request size and rate limits before executing the handler.
 */
export async function validateApiRequest(
  req: Request
): Promise<
  | { ok: true; context: ApiContext; rawBody: string }
  | { ok: false; response: NextResponse }
> {
  const requestId = getOrGenerateRequestId(req.headers);
  const clientIp = getClientIp(req.headers);

  // 1. Rate limiting check
  const rateLimit = await checkRateLimit(clientIp);
  const rateLimitHeaders = {
    "x-ratelimit-limit": String(rateLimit.limit),
    "x-ratelimit-remaining": String(rateLimit.remaining),
    "x-ratelimit-reset": String(rateLimit.reset),
    "x-request-id": requestId,
  };

  if (!rateLimit.success) {
    return {
      ok: false,
      response: createErrorResponse(
        makeError(
          "RATE_LIMITED",
          "Too many requests. Please wait a moment before trying again.",
          true
        ),
        rateLimitHeaders
      ),
    };
  }

  // 2. Body size check
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > env.MAX_BODY_BYTES) {
    return {
      ok: false,
      response: createErrorResponse(
        makeError(
          "BODY_TOO_LARGE",
          `Request body exceeds maximum allowed size (${Math.round(env.MAX_BODY_BYTES / 1024)} KB).`,
          false
        ),
        rateLimitHeaders
      ),
    };
  }

  try {
    const rawBody = await req.text();
    if (rawBody.length > env.MAX_BODY_BYTES) {
      return {
        ok: false,
        response: createErrorResponse(
          makeError(
            "BODY_TOO_LARGE",
            `Request body exceeds maximum allowed size (${Math.round(env.MAX_BODY_BYTES / 1024)} KB).`,
            false
          ),
          rateLimitHeaders
        ),
      };
    }

    return {
      ok: true,
      context: { requestId, clientIp },
      rawBody,
    };
  } catch (cause) {
    return {
      ok: false,
      response: createErrorResponse(
        makeError("VALIDATION_ERROR", "Failed to read request body.", false, cause),
        rateLimitHeaders
      ),
    };
  }
}

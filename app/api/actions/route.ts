/**
 * POST /api/actions
 * Handles Checklist extraction, Lawyer Brief generation, Options analysis, and Negotiation wording.
 * architecture.md §5.3, §6, brain.md §7 P6
 */

import { NextResponse } from "next/server";
import {
  validateApiRequest,
  createErrorResponse,
  logApiMetrics,
} from "@/server/http";
import { actionsRequestSchema } from "@/core/domain/schemas";
import { makeError } from "@/lib/result";
import { executeAction } from "@/server/services/actions";
import { getGroqProvider } from "@/server/llm";
import type { LLMProvider } from "@/server/llm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Core handler supporting provider injection for integration testing.
 */
export async function handleActionsRequest(
  req: Request,
  injectedProvider?: LLMProvider
): Promise<Response> {
  const startTime = Date.now();

  // 1. Validate request headers, body size, and rate limits
  const validation = await validateApiRequest(req);
  if (!validation.ok) {
    return validation.response;
  }

  const { context, rawBody } = validation;

  // 2. Parse and validate JSON payload
  let jsonBody: unknown;
  try {
    jsonBody = JSON.parse(rawBody);
  } catch {
    return createErrorResponse(
      makeError("VALIDATION_ERROR", "Invalid JSON in request body.", false),
      { "x-request-id": context.requestId }
    );
  }

  const parsed = actionsRequestSchema.safeParse(jsonBody);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    return createErrorResponse(
      makeError(
        "VALIDATION_ERROR",
        `Request validation failed: ${errorDetails}`,
        false
      ),
      { "x-request-id": context.requestId }
    );
  }

  const actionsRequest = parsed.data;
  const provider = injectedProvider ?? getGroqProvider();

  try {
    const result = await executeAction(actionsRequest, {
      provider,
      signal: req.signal,
    });

    logApiMetrics({
      requestId: context.requestId,
      route: "/api/actions",
      latencyMs: Date.now() - startTime,
      status: 200,
      clauseCount: actionsRequest.clauses.length,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "x-request-id": context.requestId,
      },
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Error executing action";

    logApiMetrics({
      requestId: context.requestId,
      route: "/api/actions",
      latencyMs: Date.now() - startTime,
      status: 500,
      clauseCount: actionsRequest.clauses.length,
      error: errorMessage,
    });

    return createErrorResponse(
      makeError(
        "INTERNAL_ERROR",
        `Failed to complete action: ${errorMessage}`,
        true
      ),
      { "x-request-id": context.requestId }
    );
  }
}

export async function POST(req: Request): Promise<Response> {
  return handleActionsRequest(req);
}

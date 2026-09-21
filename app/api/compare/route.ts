/**
 * POST /api/compare
 * Streams aligned clauses, word-level redline diffs, and change explanations via SSE.
 * architecture.md §5.4, brain.md §3 P5b, P5c
 */

import {
  validateApiRequest,
  createSSEStream,
  getSSEHeaders,
  createErrorResponse,
  logApiMetrics,
} from "@/server/http";
import { compareRequestSchema } from "@/core/domain/schemas";
import { makeError } from "@/lib/result";
import { compareDocuments } from "@/server/services/compare";
import { getGroqProvider } from "@/server/llm";
import type { LLMProvider } from "@/server/llm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Core handler supporting provider injection for integration testing.
 */
export async function handleCompareRequest(
  req: Request,
  injectedProvider?: LLMProvider
): Promise<Response> {
  const startTime = Date.now();

  // 1. Validate request headers, size, rate limits
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

  const parsed = compareRequestSchema.safeParse(jsonBody);
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

  const compareRequest = parsed.data;

  // 3. Set up SSE stream
  const { stream, controller } = createSSEStream();
  const provider = injectedProvider ?? getGroqProvider();

  // Heartbeat every 15s
  const heartbeatTimer = setInterval(() => {
    controller.sendHeartbeat();
  }, 15_000);

  // Run document comparison asynchronously
  (async () => {
    try {
      await compareDocuments(compareRequest, {
        provider,
        emitter: {
          emit: (event: string, data: unknown) => {
            controller.send(event, data);
          },
        },
        signal: req.signal,
      });

      logApiMetrics({
        requestId: context.requestId,
        route: "/api/compare",
        latencyMs: Date.now() - startTime,
        status: 200,
        clauseCount:
          compareRequest.clausesA.length + compareRequest.clausesB.length,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error comparing documents";

      controller.send("error", {
        code: "INTERNAL_ERROR",
        message: errorMessage,
        retryable: true,
      });

      logApiMetrics({
        requestId: context.requestId,
        route: "/api/compare",
        latencyMs: Date.now() - startTime,
        status: 500,
        clauseCount:
          compareRequest.clausesA.length + compareRequest.clausesB.length,
        error: errorMessage,
      });
    } finally {
      clearInterval(heartbeatTimer);
      controller.close();
    }
  })();

  return new Response(stream, {
    headers: getSSEHeaders(context.requestId),
  });
}

export async function POST(req: Request): Promise<Response> {
  return handleCompareRequest(req);
}

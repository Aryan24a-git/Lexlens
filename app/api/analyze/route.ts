/**
 * POST /api/analyze
 * Streams document analysis events via Server-Sent Events (SSE).
 * architecture.md §5.2, §6
 */

import {
  validateApiRequest,
  createSSEStream,
  getSSEHeaders,
  createErrorResponse,
  logApiMetrics,
} from "@/server/http";
import { analyzeRequestSchema } from "@/core/domain/schemas";
import { makeError } from "@/lib/result";
import { analyzeDocument } from "@/server/services/analyze";
import { getGroqProvider } from "@/server/llm";
import type { LLMProvider } from "@/server/llm";
import { env } from "@/server/config/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max execution duration in seconds (Node.js runtime)

/**
 * Core handler supporting provider injection for integration testing.
 */
export async function handleAnalyzeRequest(
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

  const parsed = analyzeRequestSchema.safeParse(jsonBody);
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

  const analyzeRequest = parsed.data;

  // Check clause count cap
  if (analyzeRequest.clauses.length > env.MAX_CLAUSES_PER_REQUEST) {
    return createErrorResponse(
      makeError(
        "VALIDATION_ERROR",
        `Document exceeds maximum clause limit of ${env.MAX_CLAUSES_PER_REQUEST}.`,
        false
      ),
      { "x-request-id": context.requestId }
    );
  }

  // 3. Set up SSE stream
  const { stream, controller } = createSSEStream();
  const provider = injectedProvider ?? getGroqProvider();

  // 4. Start background analysis pipeline
  // Heartbeat every 15s to keep proxy connections alive
  const heartbeatTimer = setInterval(() => {
    controller.sendHeartbeat();
  }, 15_000);

  // Run analysis asynchronously
  (async () => {
    try {
      await analyzeDocument(analyzeRequest, {
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
        route: "/api/analyze",
        latencyMs: Date.now() - startTime,
        status: 200,
        clauseCount: analyzeRequest.clauses.length,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error during document analysis";

      controller.send("error", {
        code: "INTERNAL_ERROR",
        message: errorMessage,
        retryable: true,
      });

      logApiMetrics({
        requestId: context.requestId,
        route: "/api/analyze",
        latencyMs: Date.now() - startTime,
        status: 500,
        clauseCount: analyzeRequest.clauses.length,
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
  return handleAnalyzeRequest(req);
}

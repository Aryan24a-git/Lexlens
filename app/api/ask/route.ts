/**
 * POST /api/ask
 * Streams grounded answers and citations to user questions via SSE.
 * architecture.md §5.3, §6
 */

import {
  validateApiRequest,
  createSSEStream,
  getSSEHeaders,
  createErrorResponse,
  logApiMetrics,
} from "@/server/http";
import { askRequestSchema } from "@/core/domain/schemas";
import { makeError } from "@/lib/result";
import { answerQuestion } from "@/server/services/ask";
import { getGroqProvider } from "@/server/llm";
import type { LLMProvider } from "@/server/llm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Core handler supporting provider injection for integration testing.
 */
export async function handleAskRequest(
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

  const parsed = askRequestSchema.safeParse(jsonBody);
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

  const askRequest = parsed.data;

  // 3. Set up SSE stream
  const { stream, controller } = createSSEStream();
  const provider = injectedProvider ?? getGroqProvider();

  // Heartbeat every 15s
  const heartbeatTimer = setInterval(() => {
    controller.sendHeartbeat();
  }, 15_000);

  // Run Q&A asynchronously
  (async () => {
    try {
      await answerQuestion(askRequest, {
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
        route: "/api/ask",
        latencyMs: Date.now() - startTime,
        status: 200,
        clauseCount: askRequest.clauses.length,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error answering question";

      controller.send("error", {
        code: "INTERNAL_ERROR",
        message: errorMessage,
        retryable: true,
      });

      logApiMetrics({
        requestId: context.requestId,
        route: "/api/ask",
        latencyMs: Date.now() - startTime,
        status: 500,
        clauseCount: askRequest.clauses.length,
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
  return handleAskRequest(req);
}

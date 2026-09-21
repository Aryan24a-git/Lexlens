/**
 * Server-Sent Events (SSE) helpers.
 * architecture.md §6
 */

export interface SSEMessage {
  event?: string;
  data: unknown;
  id?: string;
}

/**
 * Formats a single SSE frame.
 * Format:
 * event: <name>\n
 * data: <json>\n\n
 */
export function formatSSE(event: string, data: unknown, id?: string): string {
  let message = "";
  if (id) {
    message += `id: ${id}\n`;
  }
  if (event) {
    message += `event: ${event}\n`;
  }
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  message += `data: ${payload}\n\n`;
  return message;
}

/**
 * Formats an SSE heartbeat (comment frame) to keep connections alive.
 */
export function formatHeartbeat(): string {
  return `: heartbeat\n\n`;
}

export interface SSEController {
  send: (event: string, data: unknown, id?: string) => void;
  sendHeartbeat: () => void;
  close: () => void;
  error: (err: unknown) => void;
}

/**
 * Creates a standard WHATWG ReadableStream and an SSE controller for streaming responses.
 */
export function createSSEStream(): {
  stream: ReadableStream<Uint8Array>;
  controller: SSEController;
} {
  const encoder = new TextEncoder();
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      streamController = ctrl;
    },
    cancel() {
      streamController = null;
    },
  });

  const controller: SSEController = {
    send(event: string, data: unknown, id?: string) {
      if (!streamController) return;
      try {
        const text = formatSSE(event, data, id);
        streamController.enqueue(encoder.encode(text));
      } catch {
        // Stream closed or broken pipe
      }
    },
    sendHeartbeat() {
      if (!streamController) return;
      try {
        streamController.enqueue(encoder.encode(formatHeartbeat()));
      } catch {
        // Stream closed
      }
    },
    close() {
      if (!streamController) return;
      try {
        streamController.close();
      } catch {
        // Ignore if already closed
      } finally {
        streamController = null;
      }
    },
    error(err: unknown) {
      if (!streamController) return;
      try {
        streamController.error(err);
      } catch {
        // Ignore
      } finally {
        streamController = null;
      }
    },
  };

  return { stream, controller };
}

/**
 * Creates standard HTTP response headers for SSE streaming.
 */
export function getSSEHeaders(requestId: string): Record<string, string> {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Disables Nginx/reverse-proxy response buffering
    "x-request-id": requestId,
  };
}

"use client";

import { useCallback, useRef } from "react";

export interface SSEOptions {
  onMessage?: (event: string, data: unknown) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Parses raw SSE chunk text into individual event frames using \n\n boundaries.
 */
export function parseSSEChunk(
  buffer: string,
  onEvent: (event: string, data: unknown) => void
): string {
  let remaining = buffer;
  let delimiterIndex: number;

  while ((delimiterIndex = remaining.indexOf("\n\n")) !== -1) {
    const rawFrame = remaining.slice(0, delimiterIndex);
    remaining = remaining.slice(delimiterIndex + 2);

    const lines = rawFrame.split("\n");
    let currentEvent = "message";
    let currentData = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith(":") || trimmed === "") {
        // Comment / heartbeat / empty
        continue;
      }
      if (trimmed.startsWith("event:")) {
        currentEvent = trimmed.slice(6).trim();
      } else if (trimmed.startsWith("data:")) {
        const dataStr = line.slice(line.indexOf("data:") + 5).trim();
        currentData = currentData ? `${currentData}\n${dataStr}` : dataStr;
      }
    }

    if (currentData) {
      try {
        const parsed = JSON.parse(currentData);
        onEvent(currentEvent, parsed);
      } catch {
        onEvent(currentEvent, currentData);
      }
    }
  }

  return remaining;
}

/**
 * useSSE — fetch + ReadableStream SSE client.
 * Supports custom HTTP headers, POST bodies, and AbortSignal.
 */
export function useSSE() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const connect = useCallback(
    async (
      url: string,
      body: unknown,
      options: SSEOptions = {}
    ): Promise<void> => {
      // Cancel any ongoing connection
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          let errorText = `HTTP error ${response.status}`;
          try {
            const errorJson = await response.json();
            if (errorJson.error?.message) {
              errorText = errorJson.error.message;
            }
          } catch {
            // Ignore json parse error
          }
          throw new Error(errorText);
        }

        options.onOpen?.();

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No readable stream in response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          buffer = parseSSEChunk(buffer + text, (event, data) => {
            options.onMessage?.(event, data);
          });
        }

        options.onClose?.();
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // Normal abort, do not treat as error
          options.onClose?.();
          return;
        }
        const error = err instanceof Error ? err : new Error(String(err));
        options.onError?.(error);
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    []
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return { connect, abort };
}

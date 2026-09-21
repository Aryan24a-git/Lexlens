"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSSE } from "@/features/analysis";
import type { AskRequest, Answer, Clause } from "@/core/domain/schemas";
import type { DocType, Perspective } from "@/core/domain/enums";
import { shortId } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  answer?: Answer | undefined;
  timestamp: number;
  isStreaming?: boolean | undefined;
}

export interface UseAskOptions {
  clauses: Clause[];
  perspective: Perspective;
  docType?: DocType | undefined;
  jurisdiction?: string | undefined;
  language?: string | undefined;
  sessionId?: string | undefined;
}

export type AskStatus = "idle" | "streaming" | "success" | "error";

export interface UseAskReturn {
  status: AskStatus;
  messages: ChatMessage[];
  currentAnswer: Answer | null;
  error: string | null;
  askQuestion: (question: string) => Promise<void>;
  clearChat: () => void;
  abort: () => void;
}

/**
 * useAsk — Hook for grounded legal document Q&A over SSE.
 * architecture.md §5.3, brain.md §7 P4
 */
export function useAsk(options: UseAskOptions): UseAskReturn {
  const { connect, abort: abortSSE } = useSSE();

  const [status, setStatus] = useState<AskStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep latest options in ref to avoid stale closures in streaming callbacks
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const clearChat = useCallback(() => {
    abortSSE();
    setStatus("idle");
    setMessages([]);
    setCurrentAnswer(null);
    setError(null);
  }, [abortSSE]);

  const askQuestion = useCallback(
    async (questionText: string) => {
      const trimmed = questionText.trim();
      if (!trimmed) return;

      const userMsgId = shortId("msg-");
      const userMessage: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const assistantMsgId = shortId("ans-");
      const placeholderAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, placeholderAssistantMessage]);
      setStatus("streaming");
      setError(null);
      setCurrentAnswer(null);

      const currentOpts = optionsRef.current;

      const payload: AskRequest = {
        question: trimmed,
        clauses: currentOpts.clauses,
        perspective: currentOpts.perspective,
        language: currentOpts.language ?? "en",
        ...(currentOpts.docType ? { docType: currentOpts.docType } : {}),
        ...(currentOpts.jurisdiction
          ? { jurisdiction: currentOpts.jurisdiction }
          : {}),
        ...(currentOpts.sessionId ? { sessionId: currentOpts.sessionId } : {}),
      };

      try {
        await connect("/api/ask", payload, {
          onMessage: (event, data) => {
            if (event === "answer") {
              const ans = data as Answer;
              setCurrentAnswer(ans);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        content: ans.text,
                        answer: ans,
                        isStreaming: false,
                      }
                    : msg
                )
              );
            } else if (event === "done") {
              setStatus("success");
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        isStreaming: false,
                      }
                    : msg
                )
              );
            } else if (event === "error") {
              const errPayload = data as { message?: string };
              const msg =
                errPayload.message ?? "An error occurred while answering.";
              setError(msg);
              setStatus("error");
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: `Error: ${msg}`,
                        isStreaming: false,
                      }
                    : m
                )
              );
            }
          },
          onError: (err) => {
            setError(err.message);
            setStatus("error");
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: `Network error: ${err.message}`,
                      isStreaming: false,
                    }
                  : m
              )
            );
          },
        });
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Request failed";
        setError(errorMsg);
        setStatus("error");
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: `Failed to get answer: ${errorMsg}`,
                  isStreaming: false,
                }
              : m
          )
        );
      }
    },
    [connect]
  );

  return {
    status,
    messages,
    currentAnswer,
    error,
    askQuestion,
    clearChat,
    abort: abortSSE,
  };
}

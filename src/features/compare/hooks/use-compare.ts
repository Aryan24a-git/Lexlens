"use client";

import { useState, useCallback } from "react";
import { useSSE } from "@/features/analysis";
import type {
  Clause,
  ComparisonPair,
  CompareRequest,
} from "@/core/domain/schemas";
import type { Perspective, CompareMode } from "@/core/domain/enums";
import type { CompareSummary } from "@/core/prompts";

export type CompareStatus =
  | "idle"
  | "aligning"
  | "explaining"
  | "synthesizing"
  | "done"
  | "error";

export interface CompareStats {
  totalA: number;
  totalB: number;
  unchangedCount: number;
  modifiedCount: number;
  addedCount: number;
  removedCount: number;
}

export interface UseCompareState {
  status: CompareStatus;
  pairs: ComparisonPair[];
  stats: CompareStats | null;
  summary: CompareSummary | null;
  error: string | null;
}

export interface StartCompareParams {
  clausesA: Clause[];
  clausesB: Clause[];
  fileNameA: string;
  fileNameB: string;
  mode?: CompareMode | undefined;
  perspective: Perspective;
  jurisdiction?: string | undefined;
  language?: string | undefined;
  sessionId?: string | undefined;
}

export function useCompare() {
  const { connect, abort: abortSSE } = useSSE();

  const [state, setState] = useState<UseCompareState>({
    status: "idle",
    pairs: [],
    stats: null,
    summary: null,
    error: null,
  });

  const reset = useCallback(() => {
    abortSSE();
    setState({
      status: "idle",
      pairs: [],
      stats: null,
      summary: null,
      error: null,
    });
  }, [abortSSE]);

  const startCompare = useCallback(
    async (params: StartCompareParams) => {
      reset();

      const payload: CompareRequest = {
        clausesA: params.clausesA,
        clausesB: params.clausesB,
        fileNameA: params.fileNameA,
        fileNameB: params.fileNameB,
        mode: params.mode ?? "versions",
        perspective: params.perspective,
        language: params.language ?? "en",
        ...(params.jurisdiction
          ? { jurisdiction: params.jurisdiction }
          : {}),
        ...(params.sessionId ? { sessionId: params.sessionId } : {}),
      };

      setState((prev) => ({
        ...prev,
        status: "aligning",
        error: null,
      }));

      try {
        await connect("/api/compare", payload, {
          onMessage: (event, data) => {
            if (event === "alignment") {
              const payloadData = data as {
                pairs: ComparisonPair[];
                stats: CompareStats;
              };
              setState((prev) => ({
                ...prev,
                status: "explaining",
                pairs: payloadData.pairs,
                stats: payloadData.stats,
              }));
            } else if (event === "pair_explanation") {
              const payloadData = data as { pairs: ComparisonPair[] };
              setState((prev) => {
                const updatedMap = new Map<string, ComparisonPair>();
                for (const p of payloadData.pairs) {
                  const key = `${p.a ?? "none"}_${p.b ?? "none"}`;
                  updatedMap.set(key, p);
                }

                const mergedPairs = prev.pairs.map((p) => {
                  const key = `${p.a ?? "none"}_${p.b ?? "none"}`;
                  return updatedMap.get(key) ?? p;
                });

                return {
                  ...prev,
                  pairs: mergedPairs,
                };
              });
            } else if (event === "summary") {
              const summaryData = data as CompareSummary;
              setState((prev) => ({
                ...prev,
                status: "synthesizing",
                summary: summaryData,
              }));
            } else if (event === "done") {
              setState((prev) => ({
                ...prev,
                status: "done",
              }));
            } else if (event === "error") {
              const errPayload = data as { message?: string };
              setState((prev) => ({
                ...prev,
                status: "error",
                error: errPayload.message ?? "Comparison failed.",
              }));
            }
          },
          onError: (err) => {
            setState((prev) => ({
              ...prev,
              status: "error",
              error: err.message,
            }));
          },
        });
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Request failed";
        setState((prev) => ({
          ...prev,
          status: "error",
          error: errorMsg,
        }));
      }
    },
    [connect, reset]
  );

  return {
    ...state,
    startCompare,
    reset,
    abort: abortSSE,
  };
}

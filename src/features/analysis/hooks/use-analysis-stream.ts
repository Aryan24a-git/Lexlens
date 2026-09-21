"use client";

import { useState, useCallback } from "react";
import { useSSE } from "./use-sse";
import type {
  AnalyzeRequest,
  Clause,
  ClauseAnalysis,
  DocumentSynthesis,
} from "@/core/domain/schemas";
import type { DocType, Perspective } from "@/core/domain/enums";

export type AnalysisStatus =
  | "idle"
  | "classifying"
  | "analyzing"
  | "synthesizing"
  | "done"
  | "error";

export interface AnalysisWarning {
  code: string;
  message: string;
  clauseIds?: string[];
}

export interface AnalysisStats {
  totalClauses: number;
  analyzedClauses: number;
  verifiedRatio: number;
  durationMs: number;
}

export interface UseAnalysisStreamState {
  status: AnalysisStatus;
  docType: DocType | null;
  parties: string[];
  roles: string[];
  analyses: Record<string, ClauseAnalysis>;
  synthesis: DocumentSynthesis | null;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  warnings: AnalysisWarning[];
  error: string | null;
  stats: AnalysisStats | null;
}

export interface StartAnalysisParams {
  clauses: Clause[];
  perspective: Perspective;
  docType?: DocType | undefined;
  jurisdiction?: string | undefined;
  language?: string | undefined;
  sessionId?: string | undefined;
}

export function useAnalysisStream() {
  const { connect, abort: abortSSE } = useSSE();

  const [state, setState] = useState<UseAnalysisStreamState>({
    status: "idle",
    docType: null,
    parties: [],
    roles: [],
    analyses: {},
    synthesis: null,
    progress: { completed: 0, total: 0, percentage: 0 },
    warnings: [],
    error: null,
    stats: null,
  });

  const reset = useCallback(() => {
    abortSSE();
    setState({
      status: "idle",
      docType: null,
      parties: [],
      roles: [],
      analyses: {},
      synthesis: null,
      progress: { completed: 0, total: 0, percentage: 0 },
      warnings: [],
      error: null,
      stats: null,
    });
  }, [abortSSE]);

  const startAnalysis = useCallback(
    async (params: StartAnalysisParams) => {
      const total = params.clauses.length;

      const requestPayload: AnalyzeRequest = {
        clauses: params.clauses,
        perspective: params.perspective,
        language: params.language ?? "en",
        ...(params.docType ? { docType: params.docType } : {}),
        ...(params.jurisdiction ? { jurisdiction: params.jurisdiction } : {}),
        ...(params.sessionId ? { sessionId: params.sessionId } : {}),
      };

      setState({
        status: "classifying",
        docType: params.docType ?? null,
        parties: [],
        roles: [params.perspective],
        analyses: {},
        synthesis: null,
        progress: { completed: 0, total, percentage: 0 },
        warnings: [],
        error: null,
        stats: null,
      });

      await connect("/api/analyze", requestPayload, {
        onMessage: (event, data) => {
          if (event === "doc_type") {
            const payload = data as {
              docType: DocType;
              parties?: string[];
              roles?: string[];
            };
            setState((prev) => ({
              ...prev,
              status: "analyzing",
              docType: payload.docType,
              parties: payload.parties ?? prev.parties,
              roles: payload.roles ?? prev.roles,
            }));
          } else if (event === "clause_analysis") {
            const analysis = data as ClauseAnalysis;
            setState((prev) => {
              const updatedAnalyses = {
                ...prev.analyses,
                [analysis.clauseId]: analysis,
              };
              const completed = Object.keys(updatedAnalyses).length;
              const percentage =
                prev.progress.total > 0
                  ? Math.round((completed / prev.progress.total) * 90) // reserve last 10% for synthesis
                  : 0;

              return {
                ...prev,
                status: "analyzing",
                analyses: updatedAnalyses,
                progress: {
                  ...prev.progress,
                  completed,
                  percentage,
                },
              };
            });
          } else if (event === "synthesis") {
            const synthesis = data as DocumentSynthesis;
            setState((prev) => ({
              ...prev,
              status: "synthesizing",
              synthesis,
              progress: {
                ...prev.progress,
                percentage: 95,
              },
            }));
          } else if (event === "warning") {
            const warning = data as AnalysisWarning;
            setState((prev) => ({
              ...prev,
              warnings: [...prev.warnings, warning],
            }));
          } else if (event === "done") {
            const donePayload = data as { stats?: AnalysisStats };
            setState((prev) => ({
              ...prev,
              status: "done",
              progress: {
                ...prev.progress,
                completed: prev.progress.total,
                percentage: 100,
              },
              stats: donePayload.stats ?? null,
            }));
          } else if (event === "error") {
            const errorPayload = data as { message?: string };
            setState((prev) => ({
              ...prev,
              status: "error",
              error: errorPayload.message ?? "Analysis failed.",
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
    },
    [connect]
  );

  return {
    ...state,
    startAnalysis,
    abort: abortSSE,
    reset,
  };
}

/**
 * Hook for managing and caching Action workflows (Checklist, Lawyer Brief, Options, Negotiate).
 * architecture.md §5.3, brain.md §7 P6
 */

"use client";

import { useState, useCallback } from "react";
import type {
  Clause,
  ClauseAnalysis,
  DocumentSynthesis,
  ChecklistItem,
  LawyerBrief,
  OptionsResult,
  NegotiateResult,
  ActionResult,
} from "@/core/domain/schemas";
import type { Perspective } from "@/core/domain/enums";

export interface UseActionsOptions {
  clauses: Clause[];
  analyses?: ClauseAnalysis[] | undefined;
  synthesis?: DocumentSynthesis | undefined;
  perspective: Perspective;
  fileName?: string | undefined;
  language?: string | undefined;
}

export interface UseActionsReturn {
  // Data state
  checklist: ChecklistItem[] | null;
  brief: LawyerBrief | null;
  options: OptionsResult | null;
  negotiate: NegotiateResult | null;

  // Loading flags
  isLoadingChecklist: boolean;
  isLoadingBrief: boolean;
  isLoadingOptions: boolean;
  isLoadingNegotiate: boolean;

  // Error messages
  error: string | null;

  // Trigger methods
  fetchChecklist: () => Promise<ChecklistItem[] | null>;
  fetchBrief: () => Promise<LawyerBrief | null>;
  fetchOptions: (scenario: string) => Promise<OptionsResult | null>;
  fetchNegotiate: () => Promise<NegotiateResult | null>;

  // Mutators (e.g. toggle checklist item completion)
  completedItemIds: Set<string>;
  toggleItemCompleted: (itemId: string) => void;
}

export function useActions(options: UseActionsOptions): UseActionsReturn {
  const { clauses, analyses, synthesis, perspective, fileName, language } = options;

  const [checklist, setChecklist] = useState<ChecklistItem[] | null>(null);
  const [brief, setBrief] = useState<LawyerBrief | null>(null);
  const [optionsResult, setOptionsResult] = useState<OptionsResult | null>(null);
  const [negotiateResult, setNegotiateResult] = useState<NegotiateResult | null>(null);

  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isLoadingNegotiate, setIsLoadingNegotiate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [completedItemIds, setCompletedItemIds] = useState<Set<string>>(() => new Set());

  const toggleItemCompleted = useCallback((id: string) => {
    setCompletedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const executeActionRequest = useCallback(
    async (payload: { actionType: string; scenario?: string }): Promise<ActionResult | null> => {
      setError(null);
      try {
        const res = await fetch("/api/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType: payload.actionType,
            clauses,
            analyses,
            synthesis,
            perspective,
            fileName: fileName ?? "Document.pdf",
            scenario: payload.scenario,
            language: language ?? "en",
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const msg = (errData as { error?: { message?: string } })?.error?.message ?? `Action failed with status ${res.status}`;
          throw new Error(msg);
        }

        const data = (await res.json()) as ActionResult;
        return data;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Network error calling actions service";
        setError(msg);
        return null;
      }
    },
    [clauses, analyses, synthesis, perspective, fileName, language]
  );

  const fetchChecklist = useCallback(async (): Promise<ChecklistItem[] | null> => {
    if (checklist) return checklist;
    setIsLoadingChecklist(true);
    const result = await executeActionRequest({ actionType: "checklist" });
    setIsLoadingChecklist(false);
    if (result && result.actionType === "checklist") {
      setChecklist(result.items);
      return result.items;
    }
    return null;
  }, [checklist, executeActionRequest]);

  const fetchBrief = useCallback(async (): Promise<LawyerBrief | null> => {
    if (brief) return brief;
    setIsLoadingBrief(true);
    const result = await executeActionRequest({ actionType: "lawyer_brief" });
    setIsLoadingBrief(false);
    if (result && result.actionType === "lawyer_brief") {
      setBrief(result.brief);
      return result.brief;
    }
    return null;
  }, [brief, executeActionRequest]);

  const fetchOptions = useCallback(
    async (scenario: string): Promise<OptionsResult | null> => {
      setIsLoadingOptions(true);
      const result = await executeActionRequest({ actionType: "options", scenario });
      setIsLoadingOptions(false);
      if (result && result.actionType === "options") {
        setOptionsResult(result.result);
        return result.result;
      }
      return null;
    },
    [executeActionRequest]
  );

  const fetchNegotiate = useCallback(async (): Promise<NegotiateResult | null> => {
    if (negotiateResult) return negotiateResult;
    setIsLoadingNegotiate(true);
    const result = await executeActionRequest({ actionType: "negotiate" });
    setIsLoadingNegotiate(false);
    if (result && result.actionType === "negotiate") {
      setNegotiateResult(result.result);
      return result.result;
    }
    return null;
  }, [negotiateResult, executeActionRequest]);

  return {
    checklist,
    brief,
    options: optionsResult,
    negotiate: negotiateResult,
    isLoadingChecklist,
    isLoadingBrief,
    isLoadingOptions,
    isLoadingNegotiate,
    error,
    fetchChecklist,
    fetchBrief,
    fetchOptions,
    fetchNegotiate,
    completedItemIds,
    toggleItemCompleted,
  };
}

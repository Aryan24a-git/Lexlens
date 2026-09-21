/**
 * Actions Panel Component.
 * Unified tabbed container for Checklist, Lawyer Brief, Options, and Negotiate workflows.
 * brain.md §7 P6, architecture.md §5.3
 */

"use client";

import { useState, useEffect, useRef } from "react";
import type {
  Clause,
  ClauseAnalysis,
  DocumentSynthesis,
} from "@/core/domain/schemas";
import type { Perspective } from "@/core/domain/enums";
import { useActions } from "../hooks/use-actions";
import { ChecklistTab } from "./ChecklistTab";
import { LawyerBriefView } from "./LawyerBriefView";
import { OptionsTab } from "./OptionsTab";
import { NegotiateTab } from "./NegotiateTab";

export type ActionTab = "checklist" | "brief" | "options" | "negotiate";

export interface ActionsPanelProps {
  clauses: Clause[];
  analyses?: ClauseAnalysis[] | undefined;
  synthesis?: DocumentSynthesis | undefined;
  perspective: Perspective;
  fileName?: string | undefined;
  onSelectClause?: (clauseId: string) => void;
  defaultTab?: ActionTab | undefined;
}

export function ActionsPanel({
  clauses,
  analyses,
  synthesis,
  perspective,
  fileName,
  onSelectClause,
  defaultTab = "checklist",
}: ActionsPanelProps) {
  const [activeTab, setActiveTab] = useState<ActionTab>(defaultTab);
  const fetchedTabsRef = useRef<Set<ActionTab>>(new Set());

  const {
    checklist,
    brief,
    options,
    negotiate,
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
  } = useActions({
    clauses,
    analyses,
    synthesis,
    perspective,
    fileName,
  });

  // Automatically fetch data once when user switches to a tab if not yet fetched
  useEffect(() => {
    if (activeTab === "checklist" && !checklist && !isLoadingChecklist && !fetchedTabsRef.current.has("checklist")) {
      fetchedTabsRef.current.add("checklist");
      void fetchChecklist();
    } else if (activeTab === "brief" && !brief && !isLoadingBrief && !fetchedTabsRef.current.has("brief")) {
      fetchedTabsRef.current.add("brief");
      void fetchBrief();
    } else if (activeTab === "negotiate" && !negotiate && !isLoadingNegotiate && !fetchedTabsRef.current.has("negotiate")) {
      fetchedTabsRef.current.add("negotiate");
      void fetchNegotiate();
    }
  }, [
    activeTab,
    checklist,
    brief,
    negotiate,
    isLoadingChecklist,
    isLoadingBrief,
    isLoadingNegotiate,
    fetchChecklist,
    fetchBrief,
    fetchNegotiate,
  ]);

  const handleRetry = () => {
    fetchedTabsRef.current.delete(activeTab);
    if (activeTab === "checklist") void fetchChecklist();
    else if (activeTab === "brief") void fetchBrief();
    else if (activeTab === "negotiate") void fetchNegotiate();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--vellum-50)] text-[var(--ink-900)]">
      {/* Tab Navigation Header */}
      <div className="flex items-center gap-1 border-b border-[var(--vellum-300)] bg-[var(--vellum-100)] px-4 pt-3 shrink-0 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("checklist")}
          className={`px-3 py-2 text-xs font-semibold rounded-t border-t border-x transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "checklist"
              ? "bg-[var(--vellum-50)] border-[var(--vellum-300)] border-b-transparent text-[var(--baize-900)] shadow-sm"
              : "border-transparent text-[var(--ink-600)] hover:text-[var(--ink-900)] hover:bg-[var(--vellum-200)]"
          }`}
        >
          Obligations Checklist
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("brief")}
          className={`px-3 py-2 text-xs font-semibold rounded-t border-t border-x transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "brief"
              ? "bg-[var(--vellum-50)] border-[var(--vellum-300)] border-b-transparent text-[var(--baize-900)] shadow-sm"
              : "border-transparent text-[var(--ink-600)] hover:text-[var(--ink-900)] hover:bg-[var(--vellum-200)]"
          }`}
        >
          Lawyer Brief (Printable)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("options")}
          className={`px-3 py-2 text-xs font-semibold rounded-t border-t border-x transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "options"
              ? "bg-[var(--vellum-50)] border-[var(--vellum-300)] border-b-transparent text-[var(--baize-900)] shadow-sm"
              : "border-transparent text-[var(--ink-600)] hover:text-[var(--ink-900)] hover:bg-[var(--vellum-200)]"
          }`}
        >
          Scenario Options
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("negotiate")}
          className={`px-3 py-2 text-xs font-semibold rounded-t border-t border-x transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "negotiate"
              ? "bg-[var(--vellum-50)] border-[var(--vellum-300)] border-b-transparent text-[var(--baize-900)] shadow-sm"
              : "border-transparent text-[var(--ink-600)] hover:text-[var(--ink-900)] hover:bg-[var(--vellum-200)]"
          }`}
        >
          Negotiate & Redline
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="m-4 p-3 rounded bg-[var(--risk-high)]/10 border border-[var(--risk-high)]/30 text-xs text-[var(--risk-high)] flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={handleRetry}
            className="underline font-semibold cursor-pointer ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {activeTab === "checklist" && (
          <ChecklistTab
            items={checklist}
            isLoading={isLoadingChecklist}
            onRefresh={() => void fetchChecklist()}
            onSelectClause={onSelectClause}
            completedItemIds={completedItemIds}
            onToggleComplete={toggleItemCompleted}
            documentTitle={fileName}
          />
        )}

        {activeTab === "brief" && (
          <LawyerBriefView
            brief={brief}
            isLoading={isLoadingBrief}
            onRefresh={() => void fetchBrief()}
            onSelectClause={onSelectClause}
          />
        )}

        {activeTab === "options" && (
          <OptionsTab
            optionsResult={options}
            isLoading={isLoadingOptions}
            onExplore={(scen) => void fetchOptions(scen)}
            onSelectClause={onSelectClause}
            defaultPerspective={perspective}
          />
        )}

        {activeTab === "negotiate" && (
          <NegotiateTab
            negotiateResult={negotiate}
            isLoading={isLoadingNegotiate}
            onRefresh={() => void fetchNegotiate()}
            onSelectClause={onSelectClause}
          />
        )}
      </div>
    </div>
  );
}

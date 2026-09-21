/**
 * Action Checklist Component.
 * Obligation tracking, timeline filters, and .ics calendar export.
 * brain.md §7 P6, architecture.md §5.3
 */

"use client";

import { useState, useMemo } from "react";
import type { ChecklistItem } from "@/core/domain/schemas";
import { CitationPill } from "@/ui/patterns/CitationPill";
import { buildChecklistICS, triggerICSDownload } from "../exporters/ics-export";

export interface ChecklistTabProps {
  items: ChecklistItem[] | null;
  isLoading: boolean;
  onRefresh?: (() => void) | undefined;
  onSelectClause?: ((clauseId: string) => void) | undefined;
  completedItemIds: Set<string>;
  onToggleComplete: (itemId: string) => void;
  documentTitle?: string | undefined;
}

type OwnerFilter = "all" | "you" | "other_party" | "both";
type PriorityFilter = "all" | "high" | "medium" | "low";

export function ChecklistTab({
  items,
  isLoading,
  onRefresh,
  onSelectClause,
  completedItemIds,
  onToggleComplete,
  documentTitle = "Legal Agreement",
}: ChecklistTabProps) {
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [isExportingICS, setIsExportingICS] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      if (ownerFilter !== "all" && item.owner !== ownerFilter) return false;
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
      return true;
    });
  }, [items, ownerFilter, priorityFilter]);

  const completedCount = useMemo(() => {
    if (!items) return 0;
    return items.filter((it, idx) => completedItemIds.has(`${it.item}-${idx}`)).length;
  }, [items, completedItemIds]);

  const handleExportICS = async () => {
    if (!items || items.length === 0) return;
    setIsExportingICS(true);
    try {
      const icsString = await buildChecklistICS(items, documentTitle);
      const cleanName = documentTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      triggerICSDownload(icsString, `${cleanName}-obligations.ics`);
    } catch (err) {
      console.error("Failed to export ICS", err);
    } finally {
      setIsExportingICS(false);
    }
  };

  const handleCopyChecklist = () => {
    if (!items) return;
    const lines = items.map((it) => {
      const status = completedItemIds.has(`${it.item}`) ? "[x]" : "[ ]";
      const due = it.due ? ` (Due: ${it.due})` : "";
      const owner = ` [${it.owner}]`;
      const cite = it.citation ? ` (Ref: ${it.citation.clauseId})` : "";
      return `${status} ${it.item}${owner}${due}${cite}`;
    });

    navigator.clipboard.writeText(
      `OBLIGATIONS CHECKLIST — ${documentTitle}\n\n${lines.join("\n")}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse" role="status" aria-label="Loading checklist">
        <div className="h-6 w-48 bg-[var(--vellum-300)] rounded" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-[var(--vellum-200)] border border-[var(--vellum-300)] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="size-12 rounded-full bg-[var(--vellum-200)] border border-[var(--vellum-300)] mx-auto flex items-center justify-center text-[var(--ink-400)]">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h4 className="font-serif text-lg text-[var(--ink-900)]">No Checklist Generated Yet</h4>
          <p className="text-sm text-[var(--ink-500)] max-w-sm mx-auto mt-1">
            Extract clear obligations, actionable deadlines, and compliance tasks directly from document clauses.
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 bg-[var(--baize-800)] text-[var(--vellum-50)] text-sm rounded font-medium hover:bg-[var(--baize-900)] transition-colors"
          >
            Generate Obligations Checklist
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--vellum-300)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-semibold text-[var(--ink-900)]">
              Obligations & Action Items
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--vellum-300)] text-[var(--ink-700)]">
              {completedCount} / {items.length} done
            </span>
          </div>
          <p className="text-xs text-[var(--ink-500)] mt-0.5">
            Key responsibilities extracted and verified against contractual terms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyChecklist}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[var(--vellum-300)] bg-[var(--vellum-50)] hover:bg-[var(--vellum-200)] text-xs font-medium text-[var(--ink-700)] transition-colors cursor-pointer"
            title="Copy checklist as plain text"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? "Copied!" : "Copy"}
          </button>

          <button
            type="button"
            onClick={handleExportICS}
            disabled={isExportingICS}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--brass-600)] hover:bg-[var(--brass-700)] text-white text-xs font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            title="Download iCalendar file for Google Calendar, Outlook, or Apple Calendar"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isExportingICS ? "Exporting..." : "Export .ics"}
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Owner filter */}
        <div className="flex items-center gap-1">
          <span className="text-[var(--ink-400)] mr-1 font-medium">Party:</span>
          {(["all", "you", "other_party", "both"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setOwnerFilter(filter)}
              className={`px-2 py-1 rounded transition-colors ${
                ownerFilter === filter
                  ? "bg-[var(--baize-800)] text-[var(--vellum-50)] font-semibold"
                  : "bg-[var(--vellum-200)] text-[var(--ink-600)] hover:bg-[var(--vellum-300)]"
              }`}
            >
              {filter === "all" ? "All" : filter === "you" ? "You" : filter === "other_party" ? "Other Party" : "Both"}
            </button>
          ))}
        </div>

        {/* Priority filter */}
        <div className="flex items-center gap-1">
          <span className="text-[var(--ink-400)] mr-1 font-medium">Priority:</span>
          {(["all", "high", "medium", "low"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              className={`px-2 py-1 rounded capitalize transition-colors ${
                priorityFilter === p
                  ? "bg-[var(--baize-800)] text-[var(--vellum-50)] font-semibold"
                  : "bg-[var(--vellum-200)] text-[var(--ink-600)] hover:bg-[var(--vellum-300)]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist items */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <p className="text-xs text-[var(--ink-500)] italic py-6 text-center">
            No obligations matching the selected filters.
          </p>
        ) : (
          filteredItems.map((item, idx) => {
            const itemId = `${item.item}-${idx}`;
            const isCompleted = completedItemIds.has(itemId);

            return (
              <div
                key={itemId}
                className={`p-3.5 rounded-lg border transition-all ${
                  isCompleted
                    ? "bg-[var(--vellum-100)]/60 border-[var(--vellum-200)] opacity-70"
                    : "bg-[var(--vellum-50)] border-[var(--vellum-300)] hover:border-[var(--brass-500)]/50 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => onToggleComplete(itemId)}
                    className="mt-1 size-4 rounded border-[var(--vellum-400)] text-[var(--baize-800)] focus:ring-[var(--focus-ring-paper)] cursor-pointer"
                    aria-label={`Mark "${item.item}" as ${isCompleted ? "incomplete" : "complete"}`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider ${
                          item.priority === "high"
                            ? "bg-[var(--risk-high)]/15 text-[var(--risk-high)] border border-[var(--risk-high)]/30"
                            : item.priority === "medium"
                            ? "bg-[var(--risk-medium)]/20 text-[#855800] border border-[var(--risk-medium)]/40"
                            : "bg-[var(--vellum-300)] text-[var(--ink-600)] border border-[var(--vellum-400)]/30"
                        }`}
                      >
                        {item.priority}
                      </span>

                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--vellum-200)] text-[var(--ink-700)] font-medium">
                        {item.owner === "you"
                          ? "Your Responsibility"
                          : item.owner === "other_party"
                          ? "Counterparty"
                          : "Mutual"}
                      </span>

                      {item.due && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ink-600)] bg-[var(--vellum-200)]/70 px-1.5 py-0.5 rounded">
                          <svg className="size-3 text-[var(--ink-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {item.due}
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-sm text-[var(--ink-900)] leading-snug ${
                        isCompleted ? "line-through text-[var(--ink-400)]" : ""
                      }`}
                    >
                      {item.item}
                    </p>

                    {item.citation && (
                      <div className="mt-2 flex items-center gap-2">
                        <CitationPill
                          citation={item.citation}
                          onClick={onSelectClause}
                          showQuote={false}
                        />
                        <span className="text-xs text-[var(--ink-500)] italic truncate max-w-md">
                          &ldquo;{item.citation.quote}&rdquo;
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

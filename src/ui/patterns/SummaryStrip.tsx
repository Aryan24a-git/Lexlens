"use client";

import { cn } from "@/lib/utils";
import { CitationPill } from "./CitationPill";
import type { DocumentSynthesis } from "@/core/domain/schemas";
import type { RiskLevel } from "@/core/domain/enums";

export interface SummaryStripProps {
  synthesis: DocumentSynthesis;
  riskFilter: RiskLevel | "all";
  onFilterChange: (filter: RiskLevel | "all") => void;
  counts: {
    total: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  onCitationClick?: ((clauseId: string) => void) | undefined;
  className?: string | undefined;
}

export function SummaryStrip({
  synthesis,
  riskFilter,
  onFilterChange,
  counts,
  onCitationClick,
  className,
}: SummaryStripProps) {
  const readableDocType = synthesis.docType.replace(/_/g, " ");

  return (
    <section
      className={cn(
        "rounded-xl border bg-[var(--baize-900)] border-[var(--baize-700)] p-5 text-[var(--text-on-dark)] shadow-lg font-ui transition-all",
        className
      )}
      aria-label="Document summary and key facts"
    >
      {/* ── Top Row: Document type, perspective, and filter tabs ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-[var(--baize-700)]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-2.5 py-1 rounded bg-[var(--baize-800)] text-xs uppercase font-bold tracking-wider text-[var(--brass-300)] border border-[var(--brass-500)]/30">
            {readableDocType}
          </span>
          <span className="text-xs text-[var(--text-on-dark-2)]">
            Perspective:{" "}
            <strong className="text-[var(--text-on-dark)] uppercase font-semibold">
              {synthesis.perspective}
            </strong>
          </span>
        </div>

        {/* ── Filter Buttons ── */}
        <div
          className="inline-flex rounded-lg border border-[var(--baize-700)] p-1 bg-[var(--baize-950)] text-xs gap-1"
          role="group"
          aria-label="Filter clauses by risk"
        >
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={cn(
              "px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer",
              riskFilter === "all"
                ? "bg-[var(--brass-500)] text-[var(--baize-950)] font-bold shadow-xs"
                : "text-[var(--text-on-dark-2)] hover:text-[var(--text-on-dark)]"
            )}
          >
            All ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("high")}
            className={cn(
              "px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer flex items-center gap-1.5",
              riskFilter === "high"
                ? "bg-[var(--risk-high)] text-white font-bold shadow-xs"
                : "text-[var(--text-on-dark-2)] hover:text-[var(--text-on-dark)]"
            )}
          >
            <span className="size-1.5 rounded-full bg-[var(--risk-high)]" />
            High ({counts.high})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("medium")}
            className={cn(
              "px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer flex items-center gap-1.5",
              riskFilter === "medium"
                ? "bg-[var(--risk-medium)] text-[var(--ink-900)] font-bold shadow-xs"
                : "text-[var(--text-on-dark-2)] hover:text-[var(--text-on-dark)]"
            )}
          >
            <span className="size-1.5 rounded-full bg-[var(--risk-medium)]" />
            Medium ({counts.medium})
          </button>
          <button
            type="button"
            onClick={() => onFilterChange("low")}
            className={cn(
              "px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer flex items-center gap-1.5",
              riskFilter === "low"
                ? "bg-[var(--risk-low)] text-white font-bold shadow-xs"
                : "text-[var(--text-on-dark-2)] hover:text-[var(--text-on-dark)]"
            )}
          >
            <span className="size-1.5 rounded-full bg-[var(--risk-low)]" />
            Low ({counts.low})
          </button>
        </div>
      </div>

      {/* ── Middle: Plain English TL;DR ── */}
      <div className="py-4 border-b border-[var(--baize-700)]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--brass-300)] mb-1.5">
          Executive Summary (TL;DR)
        </h4>
        <p className="font-display text-sm md:text-base leading-relaxed text-[var(--text-on-dark)]">
          {synthesis.tldr}
        </p>
      </div>

      {/* ── Bottom: Key Facts Grid with Citations ── */}
      {synthesis.keyFacts && synthesis.keyFacts.length > 0 && (
        <div className="pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--brass-300)] mb-2.5">
            Key Extracted Facts
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {synthesis.keyFacts.map((fact, idx) => (
              <div
                key={idx}
                className="bg-[var(--baize-950)]/60 rounded-lg p-3 border border-[var(--baize-700)] flex flex-col justify-between gap-2"
              >
                <div>
                  <span className="text-xs text-[var(--text-on-dark-2)] uppercase tracking-wide block font-medium">
                    {fact.label}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-on-dark)] font-display">
                    {fact.value}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {fact.citations.map((c, citIdx) => (
                    <CitationPill
                      key={citIdx}
                      citation={c}
                      onClick={onCitationClick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

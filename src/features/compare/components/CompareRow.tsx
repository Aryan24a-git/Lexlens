"use client";

import React, { useState } from "react";
import type { ComparisonPair, Clause } from "@/core/domain/schemas";
import { RedlineText } from "@/ui/patterns/RedlineText";
import { RiskChip } from "@/ui/patterns/RiskChip";
import { CitationPill } from "@/ui/patterns/CitationPill";
import { cn } from "@/lib/utils";

export interface CompareRowProps {
  pair: ComparisonPair;
  clauseA?: Clause | undefined;
  clauseB?: Clause | undefined;
  role?: string | undefined;
  isHighlighted?: boolean | undefined;
  onCitationClick?: ((clauseId: string) => void) | undefined;
  className?: string | undefined;
}

/**
 * CompareRow — Aligned comparison unit showing status badge, word-level redline,
 * and substantive shift breakdown.
 * architecture.md §5.4, design.md §7.5
 */
export function CompareRow({
  pair,
  clauseA,
  clauseB,
  role = "you",
  isHighlighted = false,
  onCitationClick,
  className,
}: CompareRowProps) {
  const [showOriginalA, setShowOriginalA] = useState(false);

  const renderStatusBadge = () => {
    switch (pair.status) {
      case "unchanged":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[var(--baize-800)] text-[var(--text-on-dark-2)] border border-[var(--baize-700)]">
            Unchanged
          </span>
        );
      case "modified":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#f59e0b]/20 text-[#d97706] border border-[#f59e0b]/30">
            Modified
          </span>
        );
      case "added":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[var(--risk-low)]/20 text-[var(--risk-low-text,#16a34a)] border border-[var(--risk-low)]/30">
            Added in B
          </span>
        );
      case "removed":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[var(--risk-high)]/20 text-[var(--risk-high-text,#ef4444)] border border-[var(--risk-high)]/30">
            Removed in B
          </span>
        );
    }
  };

  const renderFavorsBadge = () => {
    if (!pair.favorsNow || pair.favorsNow === "unclear") return null;

    if (pair.favorsNow === "you") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--risk-low)]/20 text-[var(--risk-low-text,#16a34a)]">
          Favors {role}
        </span>
      );
    }
    if (pair.favorsNow === "other_party") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--risk-high)]/20 text-[var(--risk-high-text,#ef4444)]">
          Favors Other Party
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--baize-800)] text-[var(--text-on-dark-2)]">
        Balanced
      </span>
    );
  };

  const clauseRef = `${pair.a ?? "—"} → ${pair.b ?? "—"}`;
  const heading = clauseB?.heading ?? clauseA?.heading;

  return (
    <div
      id={pair.b ? `clause-${pair.b}` : pair.a ? `clause-${pair.a}` : undefined}
      className={cn(
        "rounded-xl border transition-all p-5 space-y-4",
        isHighlighted
          ? "border-[var(--brass-500)] bg-[var(--baize-900)] shadow-md ring-1 ring-[var(--brass-500)]"
          : "border-[var(--baize-800)] bg-[var(--baize-950)]/70 hover:border-[var(--baize-700)]",
        className
      )}
    >
      {/* Header Gutter */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--baize-800)]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[var(--brass-300)]">
            {clauseRef}
          </span>
          {heading && (
            <span className="text-xs font-semibold text-[var(--text-on-dark)] truncate max-w-sm">
              {heading}
            </span>
          )}
          {renderStatusBadge()}
        </div>

        <div className="flex items-center gap-2">
          {renderFavorsBadge()}
          {pair.severity && <RiskChip level={pair.severity} />}
        </div>
      </div>

      {/* AI Substantive Explanation (if modified/added/removed with AI data) */}
      {pair.whatChanged && (
        <div className="p-3.5 rounded-lg bg-[var(--baize-900)] border border-[var(--brass-500)]/20 space-y-2 text-xs font-ui">
          <div className="flex items-start gap-2">
            <span className="text-sm">💡</span>
            <div className="space-y-1">
              <p className="font-semibold text-[var(--text-on-dark)]">
                {pair.whatChanged}
              </p>
              {pair.impactOnYou && (
                <p className="text-[11px] text-[var(--text-on-dark-2)] leading-relaxed">
                  <strong>Impact on {role}:</strong> {pair.impactOnYou}
                </p>
              )}
            </div>
          </div>

          {pair.citations && pair.citations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {pair.citations.map((cit, idx) => (
                <CitationPill
                  key={idx}
                  citation={cit}
                  showQuote={true}
                  onClick={onCitationClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Redline Text Body */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-[var(--text-on-dark-2)]">
          <span className="font-medium uppercase tracking-wider">
            {pair.status === "unchanged"
              ? "Identical Clause Text"
              : "Word-Level Redline (Green = Added, Red = Deleted)"}
          </span>

          {pair.status === "modified" && clauseA && (
            <button
              type="button"
              onClick={() => setShowOriginalA(!showOriginalA)}
              className="hover:text-[var(--brass-300)] transition-colors cursor-pointer"
            >
              {showOriginalA ? "Show Redline Diff" : "Show Original Draft (A)"}
            </button>
          )}
        </div>

        <div className="p-3.5 rounded-lg bg-[var(--vellum-100,#fdfbf7)] text-[var(--ink-900,#111827)] font-ui text-xs leading-relaxed border border-[var(--vellum-300,#d3ccb9)]">
          {showOriginalA && clauseA ? (
            <p className="whitespace-pre-line">{clauseA.text}</p>
          ) : (
            <RedlineText ops={pair.wordDiff ?? pair.diff ?? []} />
          )}
        </div>
      </div>
    </div>
  );
}

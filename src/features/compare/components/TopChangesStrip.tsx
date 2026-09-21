"use client";

import React from "react";
import type { CompareSummary } from "@/core/prompts";
import { RiskChip } from "@/ui/patterns/RiskChip";
import { Icon } from "@/ui/icons/Icon";
import { cn } from "@/lib/utils";

export interface TopChangesStripProps {
  summary: CompareSummary;
  onSelectChange?: ((clauseBId?: string) => void) | undefined;
  className?: string | undefined;
}

/**
 * TopChangesStrip — "3 Changes That Matter Most" executive highlight cards.
 * architecture.md §5.4, design.md §7.5
 */
export function TopChangesStrip({
  summary,
  onSelectChange,
  className,
}: TopChangesStripProps) {
  const { topChanges, executiveSummary, overallShift } = summary;

  const renderShiftBadge = () => {
    switch (overallShift) {
      case "favors_you":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--risk-low)]/20 text-[var(--risk-low-text,#16a34a)] border border-[var(--risk-low)]/30">
            Net shift: Favors You
          </span>
        );
      case "favors_other_party":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--risk-high)]/20 text-[var(--risk-high-text,#ef4444)] border border-[var(--risk-high)]/30">
            Net shift: Favors Counterparty
          </span>
        );
      case "mixed":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f59e0b]/20 text-[#d97706] border border-[#f59e0b]/30">
            Net shift: Mixed Impact
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--baize-800)] text-[var(--text-on-dark-2)] border border-[var(--baize-700)]">
            Net shift: Balanced / Neutral
          </span>
        );
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--brass-500)]/30 bg-[var(--baize-900)]/80 p-5 shadow-lg space-y-4 backdrop-blur",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--brass-500)]/20">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[var(--brass-500)]/20 text-[var(--brass-300)]">
            <Icon name="compare" className="size-4" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-display text-[var(--text-on-dark)]">
              3 Changes That Matter Most
            </h3>
            <p className="text-xs text-[var(--text-on-dark-2)]">
              Ranked substantive shifts between Document A and Document B
            </p>
          </div>
        </div>

        {renderShiftBadge()}
      </div>

      <p className="text-xs text-[var(--text-on-dark)] font-ui leading-relaxed">
        {executiveSummary}
      </p>

      {topChanges.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {topChanges.map((change, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectChange?.(change.clauseB ?? change.clauseA)}
              className="text-left p-3.5 rounded-lg border border-[var(--baize-700)] bg-[var(--baize-950)]/60 hover:bg-[var(--baize-950)] hover:border-[var(--brass-500)]/50 transition-all cursor-pointer group space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--baize-800)] text-[var(--brass-300)]">
                    #{idx + 1}
                  </span>
                  <RiskChip level={change.severity} />
                </div>
                <h4 className="text-xs font-semibold text-[var(--text-on-dark)] group-hover:text-[var(--brass-300)] transition-colors leading-snug line-clamp-2">
                  {change.headline}
                </h4>
                <p className="text-[11px] text-[var(--text-on-dark-2)] leading-relaxed line-clamp-3">
                  {change.summary}
                </p>
              </div>

              {(change.clauseA || change.clauseB) && (
                <div className="pt-2 border-t border-[var(--baize-800)] flex items-center justify-between text-[10px] text-[var(--brass-500)]">
                  <span>
                    {change.clauseA ? `A: ${change.clauseA}` : ""}{" "}
                    {change.clauseA && change.clauseB ? "→" : ""}{" "}
                    {change.clauseB ? `B: ${change.clauseB}` : ""}
                  </span>
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    Inspect ↗
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

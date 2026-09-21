"use client";

import { cn } from "@/lib/utils";
import { RiskChip } from "./RiskChip";
import type { RiskLevel } from "@/core/domain/enums";

export interface CheckFirstItem {
  clauseId: string;
  headline: string;
  level: RiskLevel;
}

export interface CheckFirstListProps {
  items: CheckFirstItem[];
  selectedClauseId?: string | undefined;
  onSelectClause: (clauseId: string) => void;
  className?: string | undefined;
}

export function CheckFirstList({
  items,
  selectedClauseId,
  onSelectClause,
  className,
}: CheckFirstListProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const topItems = items.slice(0, 5);

  return (
    <div
      className={cn(
        "rounded-lg border bg-[var(--baize-900)] border-[var(--baize-700)] p-4 text-[var(--text-on-dark)] shadow-md font-ui",
        className
      )}
      aria-label="Top clauses to check first"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[var(--baize-700)] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[var(--risk-high)] animate-pulse" />
          <h3 className="font-display text-sm font-semibold tracking-wide text-[var(--brass-300)]">
            Check First
          </h3>
        </div>
        <span className="text-xs text-[var(--text-on-dark-2)] font-mono">
          {topItems.length} key {topItems.length === 1 ? "flag" : "flags"}
        </span>
      </div>

      <ol className="space-y-2">
        {topItems.map((item, index) => {
          const isSelected = selectedClauseId === item.clauseId;

          return (
            <li key={item.clauseId}>
              <button
                type="button"
                onClick={() => onSelectClause(item.clauseId)}
                aria-current={isSelected ? "true" : undefined}
                className={cn(
                  "w-full text-left p-2.5 rounded-md border transition-all cursor-pointer flex items-start gap-2.5",
                  isSelected
                    ? "bg-[var(--baize-800)] border-[var(--brass-500)] shadow-sm"
                    : "bg-[var(--baize-950)]/60 border-[var(--baize-700)] hover:border-[var(--brass-500)]/60 hover:bg-[var(--baize-800)]/50"
                )}
              >
                <span className="flex items-center justify-center size-5 rounded-full bg-[var(--baize-700)] text-[11px] font-bold text-[var(--brass-300)] shrink-0 mt-0.5 font-mono">
                  {index + 1}
                </span>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--brass-300)]">
                      {item.clauseId}
                    </span>
                    <RiskChip level={item.level} size="sm" showIcon={false} />
                  </div>
                  <p className="text-xs text-[var(--text-on-dark)] leading-snug line-clamp-2">
                    {item.headline}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

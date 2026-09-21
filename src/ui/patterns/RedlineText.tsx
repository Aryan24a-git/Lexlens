"use client";

import React from "react";
import type { DiffOp } from "@/core/domain/schemas";
import { cn } from "@/lib/utils";

export interface RedlineTextProps {
  ops: DiffOp[];
  className?: string | undefined;
  showOnlyChanges?: boolean | undefined;
}

/**
 * RedlineText — Renders deterministic word-level legal redline differences.
 * Additions in emerald green underline; deletions in oxblood/red strikethrough.
 * Accessible to screen readers via semantic tags and aria-labels.
 * architecture.md §5.4, design.md §7.5
 */
export function RedlineText({
  ops,
  className,
  showOnlyChanges = false,
}: RedlineTextProps) {
  if (!ops || ops.length === 0) {
    return <span className="text-[var(--ink-500)] italic">No textual content</span>;
  }

  return (
    <span className={cn("inline leading-relaxed font-ui", className)}>
      {ops.map((op, idx) => {
        if (op.added) {
          return (
            <ins
              key={idx}
              className="bg-[var(--risk-low)]/20 text-[#15803d] dark:text-[#4ade80] underline decoration-[#15803d]/60 decoration-2 px-0.5 rounded-xs no-underline-print font-medium"
              aria-label={`Added text: ${op.value}`}
            >
              {op.value}
            </ins>
          );
        }

        if (op.removed) {
          return (
            <del
              key={idx}
              className="bg-[var(--risk-high)]/20 text-[#b91c1c] dark:text-[#f87171] line-through decoration-[#b91c1c]/60 px-0.5 rounded-xs opacity-80"
              aria-label={`Deleted text: ${op.value}`}
            >
              {op.value}
            </del>
          );
        }

        if (showOnlyChanges) {
          return null;
        }

        return <span key={idx}>{op.value}</span>;
      })}
    </span>
  );
}

"use client";

import React, { useRef, useEffect } from "react";
import { Clause } from "@/core/domain";
import { cn } from "@/lib/utils";

export interface ClauseBlockProps {
  clause: Clause;
  isSelected?: boolean;
  isDimmed?: boolean;
  onSelect?: (clause: Clause) => void;
  onNavigate?: (direction: "up" | "down", currentClause: Clause) => void;
  className?: string;
  badge?: React.ReactNode;
}

/**
 * ClauseBlock — Bates-stamped clause unit rendered on the PaperSheet. (design.md §8)
 * Features gutter stamp (C7), highlighter underlay on selection, and accessible keyboard navigation.
 */
export function ClauseBlock({
  clause,
  isSelected = false,
  isDimmed = false,
  onSelect,
  onNavigate,
  className,
  badge,
}: ClauseBlockProps) {
  const blockRef = useRef<HTMLElement>(null);

  // Auto-scroll into view when selected (guarded for non-browser/test environments)
  useEffect(() => {
    if (
      isSelected &&
      blockRef.current &&
      typeof blockRef.current.scrollIntoView === "function"
    ) {
      blockRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isSelected]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(clause);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onNavigate?.("up", clause);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onNavigate?.("down", clause);
    }
  };

  return (
    <article
      ref={blockRef}
      id={`clause-${clause.id}`}
      tabIndex={0}
      role="article"
      aria-current={isSelected ? "true" : undefined}
      data-selected={isSelected}
      aria-label={`Clause ${clause.id}${clause.heading ? `: ${clause.heading}` : ""}`}
      onClick={() => onSelect?.(clause)}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex items-start gap-3 md:gap-5 py-3 px-2 md:px-3 rounded-[var(--radius-sm,2px)] transition-all duration-150 cursor-pointer outline-none",
        // Focus state
        "focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-paper,#1e5aa8)] focus-visible:ring-offset-2",
        // Selected marker underlay (highlighter yellow)
        isSelected
          ? "bg-[#fef9c3]/70 shadow-sm"
          : "hover:bg-[var(--vellum-200,#e6e1d3)]/50",
        // Dimmed state when filtering
        isDimmed && "opacity-40 hover:opacity-75",
        className
      )}
    >
      {/* Left gutter Bates stamp (C1..Cn) */}
      <div className="shrink-0 pt-0.5 select-none">
        <span
          className={cn(
            "inline-flex items-center justify-center min-w-[2.25rem] px-1.5 py-0.5 text-xs font-mono font-semibold rounded tracking-wider transition-colors",
            isSelected
              ? "bg-[var(--brass-500)] text-[var(--baize-950)] shadow-xs"
              : "bg-[var(--vellum-300,#d3ccb9)]/70 text-[var(--ink-700,#33423f)] group-hover:bg-[var(--brass-300)] group-hover:text-[var(--baize-950)]"
          )}
        >
          {clause.id}
        </span>
      </div>

      {/* Main clause text block */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          {clause.heading && (
            <h2 className="font-display font-bold text-sm md:text-base text-[var(--ink-900,#16211f)] tracking-tight">
              {clause.heading}
            </h2>
          )}
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        <p className="font-display text-sm md:text-[15px] leading-relaxed text-[var(--ink-900,#16211f)] whitespace-pre-line select-text">
          {clause.text}
        </p>
      </div>
    </article>
  );
}

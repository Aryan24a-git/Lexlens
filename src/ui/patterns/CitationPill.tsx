"use client";

import { cn } from "@/lib/utils";
import type { Citation } from "@/core/domain/schemas";

export interface CitationPillProps {
  citation: Citation;
  onClick?: ((clauseId: string) => void) | undefined;
  onMouseEnter?: ((clauseId: string) => void) | undefined;
  onMouseLeave?: (() => void) | undefined;
  className?: string | undefined;
  showQuote?: boolean | undefined;
}

export function CitationPill({
  citation,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
  showQuote = false,
}: CitationPillProps) {
  const isVerified = citation.verified;
  const label = `Citation ${citation.clauseId}${isVerified ? ", quote verified" : ", unverified quote"}`;

  return (
    <button
      type="button"
      onClick={() => onClick?.(citation.clauseId)}
      onMouseEnter={() => onMouseEnter?.(citation.clauseId)}
      onMouseLeave={() => onMouseLeave?.()}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-ui transition-all duration-150 cursor-pointer select-none",
        "bg-[var(--vellum-200)] text-[var(--ink-900)] border-[var(--brass-500)]/40 hover:border-[var(--brass-500)] hover:bg-[var(--vellum-300)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring-paper)]",
        className
      )}
      aria-label={label}
      title={citation.quote ? `"${citation.quote}"` : label}
    >
      <span className="font-semibold tracking-wider text-[11px] text-[var(--brass-700)]">
        {citation.clauseId}
      </span>
      {isVerified ? (
        <span
          className="text-[var(--risk-low-text)] font-bold text-[11px]"
          aria-hidden="true"
          title="Verbatim quote verified against clause text"
        >
          ✓
        </span>
      ) : (
        <span
          className="text-[var(--ink-500)] text-[10px]"
          aria-hidden="true"
          title="Unverified quote"
        >
          ?
        </span>
      )}
      {showQuote && citation.quote && (
        <span className="text-[11px] text-[var(--ink-700)] italic truncate max-w-[140px]">
          &ldquo;{citation.quote}&rdquo;
        </span>
      )}
    </button>
  );
}

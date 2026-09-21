/**
 * Negotiation & Redline Proposals Component.
 * Constructive compromise wording and fallback positions for high/medium clauses.
 * brain.md §7 P6, architecture.md §5.3
 */

"use client";

import { useState } from "react";
import type { NegotiateResult } from "@/core/domain/schemas";
import { CitationPill } from "@/ui/patterns/CitationPill";

export interface NegotiateTabProps {
  negotiateResult: NegotiateResult | null;
  isLoading: boolean;
  onRefresh?: (() => void) | undefined;
  onSelectClause?: ((clauseId: string) => void) | undefined;
}

export function NegotiateTab({
  negotiateResult,
  isLoading,
  onRefresh,
  onSelectClause,
}: NegotiateTabProps) {
  const [copiedClauseId, setCopiedClauseId] = useState<string | null>(null);

  const handleCopyWording = (clauseId: string, wording: string) => {
    navigator.clipboard.writeText(wording);
    setCopiedClauseId(clauseId);
    setTimeout(() => setCopiedClauseId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse" role="status" aria-label="Loading negotiation suggestions">
        <div className="h-6 w-52 bg-[var(--vellum-300)] rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-[var(--vellum-200)] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!negotiateResult || negotiateResult.suggestions.length === 0) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="size-12 rounded-full bg-[var(--vellum-200)] border border-[var(--vellum-300)] mx-auto flex items-center justify-center text-[var(--ink-400)]">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <h4 className="font-serif text-lg text-[var(--ink-900)]">No Negotiation Counterproposals</h4>
          <p className="text-sm text-[var(--ink-500)] max-w-sm mx-auto mt-1">
            Generate balanced compromise wording and tactical fallback positions for clauses flagged as high or medium risk.
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-4 py-2 bg-[var(--baize-800)] text-[var(--vellum-50)] text-sm rounded font-medium hover:bg-[var(--baize-900)] transition-colors cursor-pointer"
          >
            Generate Negotiation Proposals
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--vellum-300)]">
        <div>
          <h3 className="font-serif text-base font-semibold text-[var(--ink-900)]">
            Negotiation Counterproposals ({negotiateResult.suggestions.length})
          </h3>
          <p className="text-xs text-[var(--ink-500)]">
            Fair compromise wording modeled on commercial standards to address asymmetric terms.
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs font-medium text-[var(--brass-700)] hover:underline cursor-pointer"
          >
            Regenerate
          </button>
        )}
      </div>

      {/* Suggestion Cards */}
      <div className="space-y-4">
        {negotiateResult.suggestions.map((sug, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg border border-[var(--vellum-300)] bg-white shadow-sm space-y-3"
          >
            {/* Top row: clause heading + clause ID */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--vellum-200)] pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectClause?.(sug.clauseId)}
                  className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--vellum-200)] text-[var(--brass-800)] hover:underline cursor-pointer"
                >
                  {sug.clauseId}
                </button>
                <h4 className="font-serif text-sm font-semibold text-[var(--ink-900)]">
                  {sug.clauseHeading ?? "Contractual Term"}
                </h4>
              </div>

              {sug.citations.length > 0 && (
                <div className="flex items-center gap-1">
                  {sug.citations.map((c, cIdx) => (
                    <CitationPill key={cIdx} citation={c} onClick={onSelectClause} />
                  ))}
                </div>
              )}
            </div>

            {/* Problem & Impact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-[var(--risk-high)]/10 border border-[var(--risk-high)]/20">
                <span className="font-bold text-[var(--risk-high)] block mb-1">
                  Why this term is risky:
                </span>
                <p className="text-[var(--ink-800)] leading-relaxed">{sug.problem}</p>
              </div>

              <div className="p-2.5 rounded bg-[var(--vellum-100)] border border-[var(--vellum-200)]">
                <span className="font-bold text-[var(--ink-700)] block mb-1">
                  Real-world consequence:
                </span>
                <p className="text-[var(--ink-800)] leading-relaxed">{sug.whyItMatters}</p>
              </div>
            </div>

            {/* Proposed compromise wording */}
            <div className="p-3.5 rounded-lg bg-[var(--vellum-50)] border border-[var(--brass-500)]/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--brass-800)]">
                  Proposed Compromise Language
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyWording(sug.clauseId, sug.alternativeWording)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--brass-700)] hover:text-[var(--brass-800)] cursor-pointer"
                >
                  <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copiedClauseId === sug.clauseId ? "Copied!" : "Copy Proposed Text"}
                </button>
              </div>

              <p className="text-xs font-serif italic text-[var(--ink-900)] leading-relaxed bg-white p-2.5 rounded border border-[var(--vellum-200)]">
                &ldquo;{sug.alternativeWording}&rdquo;
              </p>
            </div>

            {/* Fallback Position */}
            <div className="p-2.5 rounded bg-[var(--vellum-100)]/70 text-xs border border-[var(--vellum-200)]">
              <span className="font-semibold text-[var(--ink-700)]">Fallback Position (If Rejected): </span>
              <span className="text-[var(--ink-800)]">{sug.fallbackPosition}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
